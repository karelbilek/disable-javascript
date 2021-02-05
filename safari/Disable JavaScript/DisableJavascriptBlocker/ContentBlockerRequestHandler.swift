//
//  ContentBlockerRequestHandler.swift
//  DisableJavascriptBlocker
//
//  Created by Karel Bílek on 04/02/2021.
//

import Foundation
import os.log

import BBPortal

var portal: BBPortalProtocol = BBPortal(withGroupIdentifier: "com.github.dpacassi.Disable-JavaScript", andPortalID: "json-whatever")

var i: String="-1"

class ContentBlockerRequestHandler: NSObject, NSExtensionRequestHandling {

    func beginRequest(with context: NSExtensionContext) {
        
        os_log(.default, "DISABLEJS cb start")

        os_log(.default, "DISABLEJS: poslalobyto %{public}s", i);
        let attachment = NSItemProvider(contentsOf: Bundle.main.url(forResource: "blockerList", withExtension: "json"))!
        
        let item = NSExtensionItem()
        item.attachments = [attachment]
        
        context.completeRequest(returningItems: [item], completionHandler: nil)
        
        // Receive data
        portal.onDataAvailable = {
            (data) in
            
            i=data as? String ?? ""
            
            os_log(.default, "DISABLEJS: I received some data through the portal lol")
        }
    }
    
}
