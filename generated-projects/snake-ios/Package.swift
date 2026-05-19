// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "SnakeIOS",
  platforms: [
    .iOS(.v17),
    .macOS(.v14),
  ],
  products: [
    .library(name: "SnakeIOSApp", targets: ["SnakeIOSApp"]),
    .executable(name: "SnakeIOSAppTests", targets: ["SnakeIOSAppTests"]),
  ],
  targets: [
    .target(name: "SnakeIOSApp"),
    .executableTarget(
      name: "SnakeIOSAppTests",
      dependencies: ["SnakeIOSApp"],
      path: "Tests/SnakeIOSAppTests"
    ),
  ]
)
