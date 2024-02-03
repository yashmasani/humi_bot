use lib::*;
use lib::calendar_parser::calendar_parser;
use std::fs;
use std::{ thread, time };

fn main() {
    // lib::find_today(str);
    /*let x = lib::random(1, 4);
    println!("{x}");
    let ten_s = time::Duration::from_secs(5);
    thread::sleep(ten_s);
    let x = lib::random(1, 4);
    println!("{x}");
    thread::sleep(ten_s);
    let x = lib::random(1, 4);
    println!("{x}");*/
    let date = lib::calendar_parser::date_now_est().unwrap();
    println!("{}", date.format("%Y-%m-%d").to_string());
    //println!("{:?}", lib::calendar_parser::calendar_parser("test", &date));
    let mut today = vec![TimeOffDescription { name: "Long TestMan is away".to_string(), time_away: "Away from Apr 30 to May 07".to_string() }, TimeOffDescription { name: "Ctest Mtest is away".to_string(), time_away: "Away for 1.00 day".to_string() } ];
    let prev = vec![TimeOffDescription { name: "Long TestMan is away".to_string(), time_away: "Away from Apr 30 to May 07".to_string() }, TimeOffDescription { name: "Ctest Mtest is away".to_string(), time_away: "Away for 1.00 day".to_string() } ];
    let x = rate_limit(&prev, &mut today);
    println!("{:?}", x);
}
