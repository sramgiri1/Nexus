import Foundation

public struct SnakeGameState: Sendable {
  public private(set) var gridSize: Int
  public private(set) var snake: [GridPoint]
  public private(set) var food: GridPoint
  public private(set) var score: Int
  public private(set) var direction: SnakeDirection
  public private(set) var status: SnakeGameStatus

  private var pendingDirection: SnakeDirection

  public init(
    gridSize: Int = 20,
    snake: [GridPoint]? = nil,
    food: GridPoint? = nil,
    direction: SnakeDirection = .right
  ) {
    precondition(gridSize >= 6, "Snake grid must be at least 6x6.")
    self.gridSize = gridSize
    self.snake = snake ?? [
      GridPoint(x: gridSize / 2, y: gridSize / 2),
      GridPoint(x: (gridSize / 2) - 1, y: gridSize / 2),
      GridPoint(x: (gridSize / 2) - 2, y: gridSize / 2),
    ]
    self.food = food ?? GridPoint(x: (gridSize / 2) + 3, y: gridSize / 2)
    self.score = 0
    self.direction = direction
    self.pendingDirection = direction
    self.status = .ready
  }

  public var snapshot: SnakeSnapshot {
    SnakeSnapshot(
      gridSize: gridSize,
      snake: snake,
      food: food,
      score: score,
      direction: direction,
      status: status
    )
  }

  public mutating func start() {
    if status == .ready || status == .paused {
      status = .running
    }
  }

  public mutating func pause() {
    if status == .running {
      status = .paused
    }
  }

  public mutating func restart() {
    self = SnakeGameState(gridSize: gridSize)
  }

  public mutating func setDirection(_ nextDirection: SnakeDirection) {
    if !nextDirection.isOpposite(of: direction) {
      pendingDirection = nextDirection
    }
  }

  @discardableResult
  public mutating func step() -> SnakeGameStatus {
    guard status == .running || status == .ready else {
      return status
    }

    status = .running
    direction = pendingDirection
    let nextHead = snake[0] + direction.delta
    let didEatFood = nextHead == food
    let bodyForCollision = didEatFood ? snake : Array(snake.dropLast())

    guard isInsideGrid(nextHead) else {
      status = .gameOver(reason: .wallCollision)
      return status
    }
    guard !bodyForCollision.contains(nextHead) else {
      status = .gameOver(reason: .selfCollision)
      return status
    }

    snake.insert(nextHead, at: 0)
    if didEatFood {
      score += 1
      food = nextFood(after: nextHead)
    } else {
      snake.removeLast()
    }
    return status
  }

  private func isInsideGrid(_ point: GridPoint) -> Bool {
    point.x >= 0 && point.x < gridSize && point.y >= 0 && point.y < gridSize
  }

  private func nextFood(after head: GridPoint) -> GridPoint {
    for y in 0..<gridSize {
      for x in 0..<gridSize {
        let candidate = GridPoint(x: (head.x + x + 3) % gridSize, y: (head.y + y + 5) % gridSize)
        if !snake.contains(candidate) && candidate != head {
          return candidate
        }
      }
    }
    return head
  }
}
