mod memory;
mod monitor;
mod unit;

use std::env;
use std::io;
use std::path::PathBuf;
use std::process::ExitCode;

fn main() -> ExitCode {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        print_usage();
        return ExitCode::from(2);
    }
    match args[1].as_str() {
        "monitor" => match monitor::run_repl() {
            Ok(()) => ExitCode::SUCCESS,
            Err(e) => {
                eprintln!("monitor error: {e}");
                ExitCode::from(1)
            }
        },
        "run" => {
            let path = args.get(2).map(PathBuf::from).unwrap_or_else(|| {
                eprintln!("run requires script path");
                std::process::exit(2);
            });
            match monitor::run_script(&path) {
                Ok(true) => ExitCode::SUCCESS,
                Ok(false) => ExitCode::from(1),
                Err(e) => {
                    eprintln!("run error: {e}");
                    ExitCode::from(1)
                }
            }
        }
        "help" | "-h" | "--help" => {
            print_usage();
            ExitCode::SUCCESS
        }
        _ => {
            eprintln!("unknown subcommand: {}", args[1]);
            print_usage();
            ExitCode::from(2)
        }
    }
}

fn print_usage() {
    let _ = io::Write::write_all(
        &mut io::stderr(),
        b"p30emu — P30 Phase 2 monitor emulator (P30-ISA v0.1)

Usage:
  p30emu monitor              Interactive LOAD / SAVE / VALIDATE REPL
  p30emu run <script.txt>     Batch commands (one per line)
  p30emu help

See docs/isa/P30-ISA-v0.1.md for command grammar.
",
    );
}
