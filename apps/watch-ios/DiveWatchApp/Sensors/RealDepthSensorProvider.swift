import Foundation

final class RealDepthSensorProvider: DepthSensorProvider {
    var onSample: ((DepthSample) -> Void)?

    func start() {
        // TODO: Replace MockDepthSensorProvider with CMWaterSubmersionManager-based implementation on Apple Watch Ultra.
    }

    func stop() {
        // TODO: Stop CMWaterSubmersionManager updates and release sensor resources.
    }
}
