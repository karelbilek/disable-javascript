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

var i: String="[]"

class StringProvider: NSObject, NSItemProviderWriting {
    let string: String
    init(string: String) {
        self.string = string
        super.init()
    }

    static var writableTypeIdentifiersForItemProvider: [String] {
        return [kUTTypeJSON as String]
    }

    func loadData(
        withTypeIdentifier typeIdentifier: String,
        forItemProviderCompletionHandler completionHandler: @escaping (Data?, Error?) -> Void
    ) -> Progress? {
        let data = string.data(using: .utf8)
        completionHandler(data, nil)
        return Progress(totalUnitCount: 100)
    }
}

class ContentBlockerRequestHandler: NSObject, NSExtensionRequestHandling {

    func beginRequest(with context: NSExtensionContext) {
        
        os_log(.default, "DISABLEJS cb start")

        os_log(.default, "DISABLEJS: poslalobyto %{public}s", i);
        
        let attachment=NSItemProvider(object: StringProvider(string: i))
        
//        let attachment2 = NSItemProvider(item: i, typeIdentifier: kUTTypeJSON as String)
        //let attachment = NSItemProvider(contentsOf: Bundle.main.url(forResource: "blockerList", withExtension: "json"))!
        
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
