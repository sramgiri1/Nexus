import SpriteKit

public struct SnakeTheme {
  public let background: SKColor
  public let snakeHead: SKColor
  public let snakeBody: SKColor
  public let food: SKColor
  public let grid: SKColor
  public let text: SKColor

  public init(
    background: SKColor = SKColor(red: 0.05, green: 0.07, blue: 0.08, alpha: 1),
    snakeHead: SKColor = SKColor(red: 0.10, green: 0.85, blue: 0.48, alpha: 1),
    snakeBody: SKColor = SKColor(red: 0.08, green: 0.55, blue: 0.34, alpha: 1),
    food: SKColor = SKColor(red: 0.96, green: 0.22, blue: 0.28, alpha: 1),
    grid: SKColor = SKColor(red: 0.16, green: 0.20, blue: 0.22, alpha: 1),
    text: SKColor = SKColor.white
  ) {
    self.background = background
    self.snakeHead = snakeHead
    self.snakeBody = snakeBody
    self.food = food
    self.grid = grid
    self.text = text
  }

  public static var standard: SnakeTheme {
    SnakeTheme()
  }
}
