import Foundation

public enum SnakeDirection: String, CaseIterable, Sendable {
  case up
  case down
  case left
  case right

  public var delta: GridPoint {
    switch self {
    case .up:
      GridPoint(x: 0, y: -1)
    case .down:
      GridPoint(x: 0, y: 1)
    case .left:
      GridPoint(x: -1, y: 0)
    case .right:
      GridPoint(x: 1, y: 0)
    }
  }

  public func isOpposite(of other: SnakeDirection) -> Bool {
    switch (self, other) {
    case (.up, .down), (.down, .up), (.left, .right), (.right, .left):
      true
    default:
      false
    }
  }
}

public struct GridPoint: Hashable, Sendable {
  public let x: Int
  public let y: Int

  public init(x: Int, y: Int) {
    self.x = x
    self.y = y
  }

  public static func + (left: GridPoint, right: GridPoint) -> GridPoint {
    GridPoint(x: left.x + right.x, y: left.y + right.y)
  }
}

public enum SnakeGameStatus: Equatable, Sendable {
  case ready
  case running
  case paused
  case gameOver(reason: SnakeGameOverReason)
}

public enum SnakeGameOverReason: Equatable, Sendable {
  case wallCollision
  case selfCollision
}

public struct SnakeSnapshot: Equatable, Sendable {
  public let gridSize: Int
  public let snake: [GridPoint]
  public let food: GridPoint
  public let score: Int
  public let direction: SnakeDirection
  public let status: SnakeGameStatus
}
