use crate::TimeOffDescription;
use chrono::{NaiveDate, Utc, FixedOffset};
use std::error;
use std::error::Error;
use std::fmt;


pub fn date_now_est() -> Option<NaiveDate> {
    let now_utc = Utc::now();
    //let now_utc = NaiveDate::parse_from_str("20220728", "%Y%m%d").unwrap();
    let offset_est = FixedOffset::west_opt(5 * 60 * 60)?;
    //let now_est = date_now_est().ok_or_else(|| Box::new(CalendarErrors::DateErr))?;
    let now_est = now_utc.with_timezone(&offset_est).date_naive();
    Some(now_est)
}

#[derive(Debug)]
pub enum CalendarErrors {
    DateErr
}

impl fmt::Display for CalendarErrors {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match *self {
            CalendarErrors::DateErr =>
                write!(f, "Unable to retrieve fixed offset"),
        }
    }
}

impl Error for CalendarErrors {
        fn source(&self) -> Option<&(dyn error::Error + 'static)> {
        match *self {
            CalendarErrors::DateErr => None,
        }
    }
}

pub fn calendar_parser(input: &str, now_est: &NaiveDate) -> Result<Vec<TimeOffDescription>, Box<dyn Error>> {
    let mut times:Vec<TimeOffDescription> = Vec::new();
    let mut is_start:&str = "";
    let mut is_end:&str = "";
    let mut summary:&str = "";
    for line in input.lines() {
        let line = line.trim();
        if line.starts_with("SUMMARY") {
            if let Some((_, sum)) = line.split_once("SUMMARY:") {
                summary = sum;
                dbg!("FOUND SUMMARY: {}", summary);
            }
        }
        if line.starts_with("DTSTART") {
            if let Some((_, date)) = line.split_once("DATE:") {
                is_start = date;
                dbg!("FOUND DTSTART DATE: {}", is_start);
            }
        }
        if !is_start.is_empty() && line.starts_with("DTEND") {
            if let Some((_, date)) = line.split_once("DATE:") {
                is_end = date;
                dbg!("FOUND DTEND DATE: {}", is_end);
                let start = NaiveDate::parse_from_str(&is_start, "%Y%m%d")?;
                let end = NaiveDate::parse_from_str(&is_end, "%Y%m%d")?;
                if (end - start).num_days() == 1 {
                    if start < end && *now_est >= start && *now_est < end {
                        let name = TimeOffDescription::get_name_from_summary(&summary);
                        if let Some(time_away) = TimeOffDescription::get_time_away_from_summary(start, end, &summary) {
                            times.push(TimeOffDescription { name, time_away }) 
                        }
                    }
                } else {
                    if start < end && *now_est >= start && *now_est <= end {
                        let name = TimeOffDescription::get_name_from_summary(&summary);
                        if let Some(time_away) = TimeOffDescription::get_time_away_from_summary(start, end, &summary) {
                            times.push(TimeOffDescription { name, time_away }) 
                        }
                    }
                }
            } else {
                is_start = "";
                is_end = "";
                summary = "";
            }
        }
        if !is_end.is_empty() && !is_start.is_empty() {
            is_start = "";
            is_end = "";
            summary = "";
        }
    }
    Ok(times)
}

#[cfg(test)]
pub mod calendar_tests {
    use super::*;
    #[test]
    fn parses_two_event_same_day() {
        const PARSE_EXAMPLE:&str = r#"BEGIN:VCALENDAR
        PRODID:Humi HR
        VERSION:2.0
        CALSCALE:GREGORIAN
        BEGIN:VEVENT
        UID:94ea4969da7b74f30e7dd915a038c801
        DTSTAMP:20231227T181329Z
        SUMMARY:Testle Testaf Sick Time leave for 1.00 day
        DESCRIPTION:Reason: 
        DTSTART;VALUE=DATE:20220728
        DTEND;VALUE=DATE:20220729
        END:VEVENT
        BEGIN:VEVENT
        UID:cb306d80e4eac4b135740987dd85de58
        DTSTAMP:20231227T174333Z
        SUMMARY:Testor Yoshtest Away
        DESCRIPTION:
        DTSTART;VALUE=DATE:20220728
        DTEND;VALUE=DATE:20220805
        END:VEVENT
        "#;
       
        let date = NaiveDate::parse_from_str("20220728", "%Y%m%d").unwrap();

        if let Ok(actual) = calendar_parser(&PARSE_EXAMPLE, &date) {
            let expect:[TimeOffDescription; 2] = [TimeOffDescription { name: "Testle Testaf".to_string(), time_away: "Sick Time leave for 1.00 day".to_string() }, TimeOffDescription { name: "Testor Yoshtest".to_string(), time_away: "Away from Jul 28 to Aug 05".to_string()}];
            assert_eq!(actual.len(), expect.len());
            for i in 0..expect.len() {
                assert_eq!(expect[i], actual[i]);
            }
        } else {
            assert!(false);
        };
    }
    
    #[test]
    fn only_select_events_for_particular_timstamp() {
        const PARSE_EXAMPLE:&str = r#"BEGIN:VCALENDAR
        PRODID:Humi HR
        VERSION:2.0
        CALSCALE:GREGORIAN
        BEGIN:VEVENT
        UID:94ea4969da7b74f30e7dd915a038c801
        DTSTAMP:20231227T181329Z
        SUMMARY:Testle Testaf Sick Time leave for 1.00 day
        DESCRIPTION:Reason: 
        DTSTART;VALUE=DATE:20220728
        DTEND;VALUE=DATE:20220729
        END:VEVENT
        BEGIN:VEVENT
        UID:cb306d80e4eac4b135740987dd85de58
        DTSTAMP:20231227T174333Z
        SUMMARY:Testor Yoshtest Away
        DESCRIPTION:
        DTSTART;VALUE=DATE:20220728
        DTEND;VALUE=DATE:20220805
        END:VEVENT
        "#;
        
        let date = NaiveDate::parse_from_str("20220805", "%Y%m%d").unwrap();

        if let Ok(actual) = calendar_parser(&PARSE_EXAMPLE, &date) {
            let expect:[TimeOffDescription; 1] = [TimeOffDescription { name: "Testor Yoshtest".to_string(), time_away: "Away from Jul 28 to Aug 05".to_string()}];
            assert_eq!(actual.len(), expect.len());
            for i in 0..expect.len() {
                assert_eq!(expect[i], actual[i]);
            }
        } else {
            assert!(false);
        };
    }

    #[test]
    fn read_from_sample() {
        let parse_example = std::fs::read_to_string("tests/calendar.ics").unwrap();
        let date = NaiveDate::parse_from_str("20231215", "%Y%m%d").unwrap();

        if let Ok(actual) = calendar_parser(&parse_example, &date) {
            let expect:[TimeOffDescription; 4] = [
                TimeOffDescription {
                    name: "Employee 266".to_string(),
                    time_away: "Away from Dec 14 to Dec 23".to_string(),
                },
                TimeOffDescription {
                    name: "Employee 276".to_string(),
                    time_away: "Away for 0.50 days".to_string(),
                },
                TimeOffDescription {
                    name: "Employee 282".to_string(),
                    time_away: "Away from Dec 15 to Dec 23".to_string(),
                },
                TimeOffDescription {
                    name: "Employee 283".to_string(),
                    time_away: "Away from Dec 01 to Dec 16".to_string(),
                },
            ];
            assert_eq!(actual.len(), expect.len());
            for i in 0..expect.len() {
                assert_eq!(expect[i], actual[i]);
            }
        } else {
            assert!(false);
        };
    }
}
