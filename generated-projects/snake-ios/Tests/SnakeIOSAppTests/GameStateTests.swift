@testable import SnakeIOSApp

private func expect(_ condition: @autoclosure () -> Bool, _ message: String) {
  precondition(condition(), message)
}

struct GameStateTests {
  static func testInitialStateStartsReady() {
    let state = SnakeGameState(gridSize: 12)

    expect(state.status == .ready, "initial status should be ready")
    expect(state.score == 0, "initial score should be zero")
    expect(state.snake.count == 3, "initial snake should have three segments")
  }

  static func testStepMovesSnakeForward() {
    var state = SnakeGameState(gridSize: 12, food: GridPoint(x: 10, y: 6))

    state.start()
    _ = state.step()

    expect(state.snake[0] == GridPoint(x: 7, y: 6), "snake head should move right")
    expect(state.snake.count == 3, "snake length should stay stable without food")
    expect(state.status == .running, "state should remain running")
  }

  static func testCollectingFoodGrowsSnakeAndScores() {
    var state = SnakeGameState(gridSize: 12, food: GridPoint(x: 7, y: 6))

    state.start()
    _ = state.step()

    expect(state.score == 1, "score should increase after food")
    expect(state.snake.count == 4, "snake should grow after food")
    expect(state.food != GridPoint(x: 7, y: 6), "food should respawn")
  }

  static func testWallCollisionEndsGame() {
    var state = SnakeGameState(
      gridSize: 6,
      snake: [GridPoint(x: 5, y: 2), GridPoint(x: 4, y: 2), GridPoint(x: 3, y: 2)],
      food: GridPoint(x: 0, y: 0)
    )

    state.start()
    let status = state.step()

    expect(status == .gameOver(reason: .wallCollision), "wall collision should end the game")
  }

  static func testSelfCollisionEndsGame() {
    var state = SnakeGameState(
      gridSize: 8,
      snake: [
        GridPoint(x: 3, y: 3),
        GridPoint(x: 3, y: 4),
        GridPoint(x: 2, y: 4),
        GridPoint(x: 2, y: 3),
        GridPoint(x: 2, y: 2),
      ],
      food: GridPoint(x: 7, y: 7),
      direction: .down
    )

    state.start()
    state.setDirection(.left)
    _ = state.step()
    state.setDirection(.up)
    let status = state.step()

    expect(status == .gameOver(reason: .selfCollision), "self collision should end the game")
  }

  static func testRejectsReverseDirection() {
    var state = SnakeGameState(gridSize: 12, food: GridPoint(x: 10, y: 6))

    state.start()
    state.setDirection(.left)
    _ = state.step()

    expect(state.direction == .right, "reverse direction should be ignored")
    expect(state.snake[0] == GridPoint(x: 7, y: 6), "snake should continue right")
  }

  static func testRestartResetsScoreAndStatus() {
    var state = SnakeGameState(gridSize: 12, food: GridPoint(x: 7, y: 6))

    state.start()
    _ = state.step()
    state.restart()

    expect(state.score == 0, "restart should reset score")
    expect(state.status == .ready, "restart should return to ready")
    expect(state.snake.count == 3, "restart should reset snake length")
  }
}

@main
struct GameStateTestRunner {
  static func main() {
    GameStateTests.testInitialStateStartsReady()
    GameStateTests.testStepMovesSnakeForward()
    GameStateTests.testCollectingFoodGrowsSnakeAndScores()
    GameStateTests.testWallCollisionEndsGame()
    GameStateTests.testSelfCollisionEndsGame()
    GameStateTests.testRejectsReverseDirection()
    GameStateTests.testRestartResetsScoreAndStatus()
  }
}
