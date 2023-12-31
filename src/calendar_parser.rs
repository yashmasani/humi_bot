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
                if start < end && *now_est >= start && *now_est <= end {
                    let name = TimeOffDescription::get_name_from_summary(&summary);
                    if let Some(time_away) = TimeOffDescription::get_time_away_from_summary(start, end, &summary) {
                        times.push(TimeOffDescription { name, time_away }) 
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

