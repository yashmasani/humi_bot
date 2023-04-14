use wasm_bindgen::prelude::*;
use tl::*;
use serde::{Serialize, Deserialize};
use web_sys::console;

const TODAY:&str = "Today";

#[wasm_bindgen]
pub fn find_today(input: &str) -> Result<JsValue, JsValue> {
    let raw_html = parse(input).unwrap_throw();
    println!("{:?}", raw_html);
    Ok(serde_wasm_bindgen::to_value(&raw_html)?)
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
                child_node.inner_html(parser) == TODAY
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
        // find parent with today title
    }
    console::log_1(&"Could not find Parent Node".into());
    Err("Could not find Parent Node".into())
}

fn strip_comments(input: &str) -> String {
    input.replace("<!---->", "")
}

#[wasm_bindgen]
#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct TimeOffDescription {
    name: String,
    time_away: String
}

impl TimeOffDescription {
    fn build_from_vec(v: Vec<String>) -> Option<Self> {
        let mut time_off = None;
        let mut name = String::new();
        let mut time_away = String::new();
        for val in v {
            if val.contains("day") {
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
}

fn find_list(node: &Node, parser: &Parser) -> Option<TimeOffDescription> {
    let children = node.children();
    if let Some(child_nodes) = children {
        let all_nodes = child_nodes.all(parser);
        let mut v:Vec<String> = Vec::with_capacity(4);
        if all_nodes.len() == 4 {
            all_nodes.iter().for_each(|html| {
                let text = html.inner_text(parser);
                v.push(text.to_string());
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
        let html = r#"<div _ngcontent-vvg-c630="" id="home-upcoming-events-viewer" class=""><div _ngcontent-vvg-c630="" class="ng-star-inserted"><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Today</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Colin Moore"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Colin Moore is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Colin Moore"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Tset Dome is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Friday, Apr 7 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Saturday, Apr 8</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Saturday, Apr 8 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Sunday, Apr 9</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Sunday, Apr 9 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Monday, Apr 10</div><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Colin Moore"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Colin Moore is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><!----><!----><!----><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Tuesday, Apr 11</div><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Colin Moore"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Colin Moore is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><!----><!----><!----><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Wednesday, Apr 12</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Wednesday, Apr 12 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Thursday, Apr 13</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Thursday, Apr 13 </div><!----></div><!----></div><!----></div>"#;
        let result = parse(html);
        if let Ok(times) = result {
            let expect = vec![TimeOffDescription { name: "Colin Moore is away".to_string(), time_away: "Away for 1.00 day".to_string() }, TimeOffDescription { name: "Tset Dome is away".to_string(), time_away: "Away for 1.00 day".to_string() }];
            for i in 0..times.len() {
                assert_eq!(expect[i], times[i]);
            }
        } else {
            dbg!("results is None type");
            assert!(false);
        }
    }
    #[test]
    fn parse_web_components() {
        let html = r#"<app-upcoming-events-viewer _ngcontent-hng-c427="" _nghost-hng-c418=""><div _ngcontent-hng-c418="" id="home-upcoming-events-viewer" class=""><div _ngcontent-hng-c418="" class="ng-star-inserted"><div _ngcontent-hng-c418="" class="day-container ng-star-inserted"><div _ngcontent-hng-c418="">Today</div><div _ngcontent-hng-c418="" class="upcoming-event ng-star-inserted"><div _ngcontent-hng-c418="" class="avatar-container"><app-avatar _ngcontent-hng-c418="" size="medium" _nghost-hng-c76=""><div _ngcontent-hng-c76="" class="circular image medium ui text ng-star-inserted" title="Ryan Pedro"><!----><span _ngcontent-hng-c76="" class="ng-star-inserted">RP</span><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-hng-c418="" class="upcoming-event-text-container"><div _ngcontent-hng-c418="" class="upcoming-event-title">Ryan Pedro is away  for part of the day</div><div _ngcontent-hng-c418="" class="upcoming-event-description">Away for 0.50 days</div></div></div><!----><!----><!----><!----></div><div _ngcontent-hng-c418="" class="day-container ng-star-inserted"><div _ngcontent-hng-c418="">Saturday, Apr 15</div><!----><!----><!----><div _ngcontent-hng-c418="" class="no-events ng-star-inserted"> No events on Saturday, Apr 15 </div><!----></div><div _ngcontent-hng-c418="" class="day-container ng-star-inserted"><div _ngcontent-hng-c418="">Sunday, Apr 16</div><div _ngcontent-hng-c418="" class="upcoming-event ng-star-inserted"><div _ngcontent-hng-c418="" class="avatar-container"><app-avatar _ngcontent-hng-c418="" size="medium" _nghost-hng-c76=""><div _ngcontent-hng-c76="" class="circular image medium ui text ng-star-inserted" title="Mahshid Yassaei"><!----><span _ngcontent-hng-c76="" class="ng-star-inserted">MY</span><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-hng-c418="" class="upcoming-event-text-container"><div _ngcontent-hng-c418="" class="upcoming-event-title">Mahshid Yassaei's birthday</div><div _ngcontent-hng-c418="" class="upcoming-event-description">Happy Birthday!</div></div></div><!----><!----><!----><!----></div><div _ngcontent-hng-c418="" class="day-container ng-star-inserted"><div _ngcontent-hng-c418="">Monday, Apr 17</div><!----><!----><!----><div _ngcontent-hng-c418="" class="no-events ng-star-inserted"> No events on Monday, Apr 17 </div><!----></div><div _ngcontent-hng-c418="" class="day-container ng-star-inserted"><div _ngcontent-hng-c418="">Tuesday, Apr 18</div><!----><!----><!----><div _ngcontent-hng-c418="" class="no-events ng-star-inserted"> No events on Tuesday, Apr 18 </div><!----></div><div _ngcontent-hng-c418="" class="day-container ng-star-inserted"><div _ngcontent-hng-c418="">Wednesday, Apr 19</div><!----><!----><!----><div _ngcontent-hng-c418="" class="no-events ng-star-inserted"> No events on Wednesday, Apr 19 </div><!----></div><div _ngcontent-hng-c418="" class="day-container ng-star-inserted"><div _ngcontent-hng-c418="">Thursday, Apr 20</div><!----><!----><!----><div _ngcontent-hng-c418="" class="no-events ng-star-inserted"> No events on Thursday, Apr 20 </div><!----></div><!----></div><!----></div></app-upcoming-events-viewer>"#;
        let result = parse(html);
        if let Ok(times) = result {
            let expect = vec![TimeOffDescription { name: "Ryan Pedro is away  for part of the day".to_string(), time_away: "Away for 0.50 days".to_string() }];
            assert_eq!(times.len(), expect.len());
            for i in 0..times.len() {
                assert_eq!(expect[i], times[i]);
            }
        } else {
            dbg!("results is None type");
            assert!(false);
        }
    }
}

