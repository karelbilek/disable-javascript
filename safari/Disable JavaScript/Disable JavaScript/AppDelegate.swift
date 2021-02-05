//
//  AppDelegate.swift
//  Disable JavaScript
//
//  Created by Karel Bílek on 04/02/2021.
//

import Cocoa
import os.log
import BBPortal



@main
class AppDelegate: NSObject, NSApplicationDelegate {

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Insert code here to initialize your application
        os_log(.default, "DISABLEJS: app start")
        
        
    }

    func applicationWillTerminate(_ notification: Notification) {
        // Insert code here to tear down your application
        os_log(.default, "DISABLEJS: end")
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

}
