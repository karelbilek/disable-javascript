//
//  SafariWebExtensionHandler.swift
//  Disable JavaScript Extension
//
//  Created by Karel Bílek on 04/02/2021.
//

import SafariServices
import os.log
import BBPortal
import SafariServices

let SFExtensionMessageKey = "message"

var portal: BBPortalProtocol = BBPortal(withGroupIdentifier: "com.github.dpacassi.Disable-JavaScript", andPortalID: "json-whatever")

var saved = "[]"

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

	func beginRequest(with context: NSExtensionContext) {
    
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey]
        
        let messageForced = message!
        let messageForcedDictionary = messageForced as! NSMutableDictionary
        let messageMessage = messageForcedDictionary["message"]
        let nevimType = type(of: messageMessage)
        let nevim = String(describing: nevimType.self)

        os_log(.default, "DISABLEJS: nevim forced: %{public}s", nevim)
        
        let messageMessageForced = messageMessage as!String
//
//        let messageString = String(format: "%@", message as! CVarArg)
        os_log(.default, "DISABLEJS: Received message from browser.runtime.sendNativeMessage: %{public}s", messageMessageForced)
        
        saved=messageMessageForced
        
        portal.send(data: String(saved)) {(error) in
            os_log(.default, "DISABLEJS: Error on sending?")
        }
        os_log(.default, "DISABLEJS: sent")

        
        os_log(.default, "DISABLEJS: before reload")

        SFContentBlockerManager.reloadContentBlocker(withIdentifier: "com.github.dpacassi.Disable-JavaScript.DisableJavascriptBlocker") {error in
                if error == nil {
                    os_log(.default, "DISABLEJS: reload SUCC")
                } else {
                    os_log(.default, "DISABLEJS: wut reload FAIL")
                    os_log("DISABLEJS: %{public}s", log: .default, type: .error, String(describing: error))
                }
            }

        os_log(.default, "DISABLEJS: after reload")

        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "Poopoo response to": message ] ]

        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
    
}
