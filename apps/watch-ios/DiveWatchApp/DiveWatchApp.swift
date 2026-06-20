import SwiftUI

@main
struct DiveWatchApp: App {
    @StateObject private var sessionStore = DiveSessionStore()

    var body: some Scene {
        WindowGroup {
            HomeView(store: sessionStore)
        }
    }
}
