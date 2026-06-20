import Foundation

public final class RealDepthSensorProvider: DepthSensorProvider {
    public var onSample: ((DepthSample) -> Void)?

    public init() {}

    public func start() {
        // TODO: Integrate CMWaterSubmersionManager on Apple Watch Ultra hardware.
    }

    public func stop() {
        // TODO: Stop CMWaterSubmersionManager updates and clean up callbacks.
    }
}
