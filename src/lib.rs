pub mod calendar_parser;
use std::{borrow::Borrow, cell::RefCell};
use std::thread::LocalKey;
use chrono::{NaiveDate, format};
use wasm_bindgen::prelude::*;
use tl::*;
use serde::{Serialize, Deserialize};
use web_sys::console;
use js_sys::Date;
use calendar_parser::{ calendar_parser, date_now_est, CalendarErrors };

thread_local! {
    pub static PREV_TIMEOFF: RefCell<Vec<TimeOffDescription>> = RefCell::new(vec![])
}

const TODAY:&str = "Today";

const EMOTES_TRAVEL: [&str; 5] = [
    "\u{1F6EC}",
    "\u{1FA82}",
    "\u{1F681}",
    "\u{1F680}",
    "\u{1F68C}",
];

const EMOTES: [&str; 5] = [
    "\u{1F3DD}",
    "\u{1F305}",
    "\u{1F306}",
    "\u{2600}",
    "\u{1F3DE}"
];

/*
 * Returns an array of TimeOffDescription
 * */
#[wasm_bindgen]
pub fn find_today(input: &str) -> Result<String, JsError> {
    //let raw_html = parse(input).unwrap_throw();
    //println!("{:?}", raw_html);
    let now_est = date_now_est().ok_or_else(|| Box::new(CalendarErrors::DateErr))?;
    let time_off = calendar_parser(input, &now_est).unwrap_throw();
    let time_off = PREV_TIMEOFF.with_borrow(|p| rate_limit(p, &time_off));
    let formatted_post = create_post_format(&time_off);
    Ok(formatted_post)
}

pub fn random(start:u8, stop:u8, day_index: u32 ) -> u8 {
    for i in (start..=stop).rev() {
        let div = day_index % i as u32;
        if div == 0 {
            return i;
        }
    }
    return start;
}


/*
 * Uses an array of TimeOffDescription to generate mkdown text
 * */
#[wasm_bindgen]
pub fn render_mkdown(input: &str) -> Result<String, JsValue>{
    let time_off = parse(input).unwrap_throw();
    let formatted_post = create_post_format(&time_off);
    Ok(formatted_post)
}

pub fn create_post_format(time_off: &Vec<TimeOffDescription>) -> String {
    let mut mkdown = String::new();
    const SEARCH_TERM: &str = "is away";
    let rand = random(1, 5, Date::new_0().get_seconds());
    let mut rand_index:usize = (rand-1) as usize;
    for person in time_off {
        let name = person.name.as_str().split(SEARCH_TERM).nth(0);
        let time_away = &person.time_away;
        if let Some(n) = name {
            if time_away.contains("from") {
                let emote = EMOTES_TRAVEL[rand_index];
                mkdown.push_str(format!("{} → {} {}", n, time_away, emote).as_str());
            } else {
                let emote = EMOTES[rand_index];
                mkdown.push_str(format!("{} → {} {}", n, time_away, emote).as_str());
            }
            mkdown.push_str("\n");
        }
        rand_index += 1;
        if rand_index == EMOTES.len() {
            rand_index = 0;
        }
    }
    mkdown
}

pub fn parse(input: &str) -> Result<Vec<TimeOffDescription>, Box<dyn std::error::Error>>{
    let new_input = strip_comments(input);
    let dom = tl::parse(new_input.as_str(), ParserOptions::default()).unwrap_throw();
    let parser = dom.parser();
    let nodes = dom.query_selector("div").unwrap_throw();
    for node in nodes {
        let html_tag = node.get(parser).unwrap_throw();
        let children = html_tag.children();
        if let Some(elems) = children {
            let is_parent = elems.top().iter().any(|child| {
                let child_node = child.get(parser).unwrap_throw();
                let inner_html = child_node.inner_html(parser);
                inner_html == TODAY
            });
            if is_parent {
                // parent=> node containing Today+rest of away info
                let times = elems.all(parser).iter().filter_map(|node| {
                    find_list(node, parser)
                }).collect();
                return Ok(times);
            }
        } else {
            continue;
        }
    }
    console::log_1(&"Could not find Parent Node".into());
    Ok(Vec::new())
}

fn strip_comments(input: &str) -> String {
    input.replace("<!---->", "")
}

// limit messages i.e if previous person has longer than 1 day, don't spam everyday
// unless grouped in with others
pub fn rate_limit(prev_timeoff: &Vec<TimeOffDescription>, timeoff: &Vec<TimeOffDescription>) -> Vec<TimeOffDescription> {
    let mut rated_timeoff: Vec<TimeOffDescription> = vec![];
    if prev_timeoff.len() >= timeoff.len() {
    // rate limit if timeoff is subset of prev
        let is_subset = timeoff.iter().all(|x| prev_timeoff.iter().find(|p| *p == x).is_some());
        println!("subst:::: {is_subset}");
        if !is_subset {
            for i in 0..timeoff.len() {
                rated_timeoff.push(timeoff[i].clone());
            }
        } else {
            // only single days when its a subset
            for i in 0..timeoff.len() {
                if !timeoff[i].time_away.contains("Away from"){
                    rated_timeoff.push(timeoff[i].clone());     
                }
            }
        }
    } else {
        for i in 0..timeoff.len() {
            rated_timeoff.push(timeoff[i].clone());
        }
    }
    rated_timeoff 
}

//#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TimeOffDescription {
    pub name: String,
    pub time_away: String
}

impl TimeOffDescription {
    fn build_from_vec(v: Vec<String>) -> Option<Self> {
        let mut time_off = None;
        let mut name = String::new();
        let mut time_away = String::new();
        for val in v {
            if val.contains("Away for") {
                time_away = val;
            } else if val.contains("Away from") {
                time_away = val;
            } else if val.contains("away") {
                name = val;
            }
        }
        if !name.is_empty() && !time_away.is_empty() {
            time_off = Some(TimeOffDescription { name, time_away });
        }
        time_off
    }

    fn get_name_from_summary(v:&str) -> String {
        let mut f_name = String::new();
        let mut s_name = String::new();
        let sp = v.split_whitespace();
        for (i, s) in sp.enumerate() {
            if i == 0 {
                f_name = s.to_string();
            }
            if i == 1 {
                s_name = s.to_string();
            }
        }
        format!("{} {}", f_name, s_name)
    } 

    fn get_time_away_from_summary(start_date: NaiveDate, end_date: NaiveDate, summary:&str) -> Option<String> {
        let duration = end_date.signed_duration_since(start_date);
        let fmt = format::StrftimeItems::new("%b %d");
        dbg!("{}", duration);
        if !duration.is_zero() && duration.num_days() > 1 {
            Some(format!("Away from {} to {}", start_date.format_with_items(fmt.clone()), end_date.format_with_items(fmt.clone())))
        } else {
            let sp = summary.splitn(3, ' ').last();
            match sp {
                Some(s) => Some(s.to_string()),
                None => None
            }
        } 
    }
}

fn find_list(node: &Node, parser: &Parser) -> Option<TimeOffDescription> {
    let children = node.children();
    if let Some(child_nodes) = children {
        let all_nodes = child_nodes.all(parser);
        let mut v:Vec<String> = Vec::with_capacity(4);
        if all_nodes.len() == 4 {
            all_nodes.iter().for_each(|html| {
                let text = html.inner_text(parser);
                if !text.contains(&['>', '<']) {
                    dbg!("{:?}", &text);
                    v.push(text.to_string());
                }
            });
            v.sort();
            v.dedup();
        }
        if v.len() == 2 {
            return TimeOffDescription::build_from_vec(v);
        }
    }
    None
}


#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn it_works() {
        let html = r#"<div _ngcontent-vvg-c630="" id="home-upcoming-events-viewer" class=""><div _ngcontent-vvg-c630="" class="ng-star-inserted"><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Today</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Ctest Mtest"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Ctest Mtest is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Ctest Mtest"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Tset Dome is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Friday, Apr 7 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Saturday, Apr 8</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Saturday, Apr 8 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Sunday, Apr 9</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Sunday, Apr 9 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Monday, Apr 10</div><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Ctest Mtest"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Ctest Mtest is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><!----><!----><!----><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Tuesday, Apr 11</div><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Ctest Mtest"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Ctest Mtest is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><!----><!----><!----><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Wednesday, Apr 12</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Wednesday, Apr 12 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Thursday, Apr 13</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Thursday, Apr 13 </div><!----></div><!----></div><!----></div>"#;
        let result = parse(html);
        if let Ok(times) = result {
            let expect = vec![TimeOffDescription { name: "Ctest Mtest is away".to_string(), time_away: "Away for 1.00 day".to_string() }, TimeOffDescription { name: "Tset Dome is away".to_string(), time_away: "Away for 1.00 day".to_string() }];
            for i in 0..times.len() {
                assert_eq!(expect[i], times[i]);
            }
        } else {
            dbg!("results is None type");
            assert!(false);
        }
    }
    #[test]
    fn multiple_away() {
        const html:&str = r#"<div _ngcontent-rnr-c523="" class="day-container ng-star-inserted"><div _ngcontent-rnr-c523="">Today</div><div _ngcontent-rnr-c523="" class="upcoming-event ng-star-inserted"><div _ngcontent-rnr-c523="" class="avatar-container"><app-avatar _ngcontent-rnr-c523="" size="medium" _nghost-rnr-c18=""><div _ngcontent-rnr-c18="" class="circular image medium ui text ng-star-inserted" title="Test TaTest"><!----><span _ngcontent-rnr-c18="" class="ng-star-inserted">RT</span><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-rnr-c523="" class="upcoming-event-text-container"><div _ngcontent-rnr-c523="" class="upcoming-event-title">Test TaTest is away</div><div _ngcontent-rnr-c523="" class="upcoming-event-description">Away for 1.00 day</div></div></div><div _ngcontent-rnr-c523="" class="upcoming-event ng-star-inserted"><div _ngcontent-rnr-c523="" class="avatar-container"><app-avatar _ngcontent-rnr-c523="" size="medium" _nghost-rnr-c18=""><div _ngcontent-rnr-c18="" class="circular image medium ui text ng-star-inserted" title="Test PTest"><!----><span _ngcontent-rnr-c18="" class="ng-star-inserted">RP</span><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-rnr-c523="" class="upcoming-event-text-container"><div _ngcontent-rnr-c523="" class="upcoming-event-title">Test PTest is away  for part of the day</div><div _ngcontent-rnr-c523="" class="upcoming-event-description">Away for 0.50 days</div></div></div><!----><!----><!----><!----></div>"#;
        let result = parse(html);
        if let Ok(time_off) = result {
            let expect = vec![TimeOffDescription{ name: "Test TaTest is away".to_string(), time_away: "Away for 1.00 day".to_string() }, TimeOffDescription { name: "Test PTest is away  for part of the day".to_string(), time_away: "Away for 0.50 days".to_string() }];
            assert_eq!(time_off.len(), expect.len());
            for i in 0..time_off.len() {
                assert_eq!(expect[i], time_off[i]);
            }
        } else {
            dbg!("results is None type");
            assert!(false);
        }

    }
    #[test]
    fn parse_web_components() {
        let html = r#"<app-upcoming-events-viewer _ngcontent-hng-c427="" _nghost-hng-c418=""><div _ngcontent-hng-c418="" id="home-upcoming-events-viewer" class=""><div _ngcontent-hng-c418="" class="ng-star-inserted"><div _ngcontent-hng-c418="" class="day-container ng-star-inserted"><div _ngcontent-hng-c418="">Today</div><div _ngcontent-hng-c418="" class="upcoming-event ng-star-inserted"><div _ngcontent-hng-c418="" class="avatar-container"><app-avatar _ngcontent-hng-c418="" size="medium" _nghost-hng-c76=""><div _ngcontent-hng-c76="" class="circular image medium ui text ng-star-inserted" title="RTest PTest"><!----><span _ngcontent-hng-c76="" class="ng-star-inserted">RP</span><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-hng-c418="" class="upcoming-event-text-container"><div _ngcontent-hng-c418="" class="upcoming-event-title">RTest PTest is away  for part of the day</div><div _ngcontent-hng-c418="" class="upcoming-event-description">Away for 0.50 days</div></div></div><!----><!----><!----><!----></div><div _ngcontent-hng-c418="" class="day-container ng-star-inserted"><div _ngcontent-hng-c418="">Saturday, Apr 15</div><!----><!----><!----><div _ngcontent-hng-c418="" class="no-events ng-star-inserted"> No events on Saturday, Apr 15 </div><!----></div><div _ngcontent-hng-c418="" class="day-container ng-star-inserted"><div _ngcontent-hng-c418="">Sunday, Apr 16</div><div _ngcontent-hng-c418="" class="upcoming-event ng-star-inserted"><div _ngcontent-hng-c418="" class="avatar-container"><app-avatar _ngcontent-hng-c418="" size="medium" _nghost-hng-c76=""><div _ngcontent-hng-c76="" class="circular image medium ui text ng-star-inserted" title="MTest Ytest"><!----><span _ngcontent-hng-c76="" class="ng-star-inserted">MY</span><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-hng-c418="" class="upcoming-event-text-container"><div _ngcontent-hng-c418="" class="upcoming-event-title">MTest Ytest's birthday</div><div _ngcontent-hng-c418="" class="upcoming-event-description">Happy Birthday!</div></div></div><!----><!----><!----><!----></div><div _ngcontent-hng-c418="" class="day-container ng-star-inserted"><div _ngcontent-hng-c418="">Monday, Apr 17</div><!----><!----><!----><div _ngcontent-hng-c418="" class="no-events ng-star-inserted"> No events on Monday, Apr 17 </div><!----></div><div _ngcontent-hng-c418="" class="day-container ng-star-inserted"><div _ngcontent-hng-c418="">Tuesday, Apr 18</div><!----><!----><!----><div _ngcontent-hng-c418="" class="no-events ng-star-inserted"> No events on Tuesday, Apr 18 </div><!----></div><div _ngcontent-hng-c418="" class="day-container ng-star-inserted"><div _ngcontent-hng-c418="">Wednesday, Apr 19</div><!----><!----><!----><div _ngcontent-hng-c418="" class="no-events ng-star-inserted"> No events on Wednesday, Apr 19 </div><!----></div><div _ngcontent-hng-c418="" class="day-container ng-star-inserted"><div _ngcontent-hng-c418="">Thursday, Apr 20</div><!----><!----><!----><div _ngcontent-hng-c418="" class="no-events ng-star-inserted"> No events on Thursday, Apr 20 </div><!----></div><!----></div><!----></div></app-upcoming-events-viewer>"#;
        let result = parse(html);
        if let Ok(times) = result {
            let expect = vec![TimeOffDescription { name: "RTest PTest is away  for part of the day".to_string(), time_away: "Away for 0.50 days".to_string() }];
            assert_eq!(times.len(), expect.len());
            for i in 0..times.len() {
                assert_eq!(expect[i], times[i]);
            }
        } else {
            dbg!("results is None type");
            assert!(false);
        }
    }
    #[test]
    fn test_away_from() {
        let html = r#"<div _ngcontent-vvg-c630="" id="home-upcoming-events-viewer" class=""><div _ngcontent-vvg-c630="" class="ng-star-inserted"><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Today</div><!----><!----><!----><div _ngcontent-vwv-c421="" class="upcoming-event ng-star-inserted"><div _ngcontent-vwv-c421="" class="avatar-container"><app-avatar _ngcontent-vwv-c421="" size="medium" _nghost-vwv-c76=""><div _ngcontent-vwv-c76="" class="circular image medium ui text ng-star-inserted" title="Long TestMan"><!----><span _ngcontent-vwv-c76="" class="ng-star-inserted">EC</span><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vwv-c421="" class="upcoming-event-text-container"><div _ngcontent-vwv-c421="" class="upcoming-event-title">Long TestMan is away</div><div _ngcontent-vwv-c421="" class="upcoming-event-description">Away from Apr 30 to May 07</div></div></div><div _ngcontent-lgw-c618="" class="upcoming-event ng-star-inserted"><div _ngcontent-lgw-c618="" class="avatar-container"><app-avatar _ngcontent-lgw-c618="" size="medium" _nghost-lgw-c18=""><div _ngcontent-lgw-c18="" class="circular image medium ui text ng-star-inserted" title="TestZa Test"><!----><span _ngcontent-lgw-c18="" class="ng-star-inserted">RT</span><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-lgw-c618="" class="upcoming-event-text-container"><div _ngcontent-lgw-c618="" class="upcoming-event-title">TestZa Test's work anniversary</div><div _ngcontent-lgw-c618="" class="upcoming-event-description">Celebrating 2 years at TestMate</div></div></div><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Ctest Mtest"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Ctest Mtest is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Ctest Mtest"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Tset Dome is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Friday, Apr 7 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Saturday, Apr 8</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Saturday, Apr 8 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Sunday, Apr 9</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Sunday, Apr 9 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Monday, Apr 10</div><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Ctest Mtest"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Ctest Mtest is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><!----><!----><!----><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Tuesday, Apr 11</div><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Ctest Mtest"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Ctest Mtest is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><!----><!----><!----><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Wednesday, Apr 12</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Wednesday, Apr 12 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Thursday, Apr 13</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Thursday, Apr 13 </div><!----></div><!----></div><!----></div>"#;
        let expect = vec![TimeOffDescription { name: "Long TestMan is away".to_string(), time_away: "Away from Apr 30 to May 07".to_string() }, TimeOffDescription { name: "Ctest Mtest is away".to_string(), time_away: "Away for 1.00 day".to_string() }, TimeOffDescription { name: "Tset Dome is away".to_string(), time_away: "Away for 1.00 day".to_string() }];
        let actual = parse(html).unwrap_or(vec![]);
        assert_eq!(actual.len(), expect.len());
        for i in 0..actual.len() {
            assert_eq!(expect[i], actual[i]);
        }
    }
    #[test]
    fn random_test() {
        let actual = random(1, 4, 4);
        let expect = 4;
        assert_eq!(actual, expect);
        let actual = random(1, 4, 2);
        let expect = 2;
        assert_eq!(actual, expect);
        let actual = random(1, 10, 5);
        let expect = 5;
        assert_eq!(actual, expect);
        let actual = random(1, 5, 52);
        let expect = 4;
        assert_eq!(actual, expect);
    }
    #[test]
    fn limit_rate_for_single_day() {
        let mut today = vec![TimeOffDescription { name: "Long TestMan is away".to_string(), time_away: "Away from Apr 30 to May 07".to_string() }, TimeOffDescription { name: "Ctest Mtest is away".to_string(), time_away: "Away for 1.00 day".to_string() } ];
        let prev = vec![TimeOffDescription { name: "Long TestMan is away".to_string(), time_away: "Away from Apr 30 to May 07".to_string() }, TimeOffDescription { name: "Ctest Mtest is away".to_string(), time_away: "Away for 1.00 day".to_string() } ];
        let actual = rate_limit(&prev, &mut today);
        let expect = [TimeOffDescription { name: "Ctest Mtest is away".to_string(), time_away: "Away for 1.00 day".to_string() }];
        assert_eq!(actual.len(), expect.len());
        assert_eq!(actual[0], expect[0]);
    }
}

