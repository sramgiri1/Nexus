import SpriteKit

public final class SnakeGameScene: SKScene {
  private var gameState: SnakeGameState
  private let theme: SnakeTheme
  private let tileInset: CGFloat = 2
  private var lastUpdateTime: TimeInterval = 0
  private let stepInterval: TimeInterval = 0.16

  public init(size: CGSize, gameState: SnakeGameState = SnakeGameState(), theme: SnakeTheme = .standard) {
    self.gameState = gameState
    self.theme = theme
    super.init(size: size)
    scaleMode = .resizeFill
    backgroundColor = theme.background
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    nil
  }

  public override func didMove(to view: SKView) {
    super.didMove(to: view)
    gameState.start()
    redraw()
  }

  public override func update(_ currentTime: TimeInterval) {
    if lastUpdateTime == 0 {
      lastUpdateTime = currentTime
    }
    guard currentTime - lastUpdateTime >= stepInterval else {
      return
    }
    lastUpdateTime = currentTime
    _ = gameState.step()
    redraw()
  }

  public func turn(_ direction: SnakeDirection) {
    gameState.setDirection(direction)
  }

  public func restart() {
    gameState.restart()
    gameState.start()
    redraw()
  }

  private func redraw() {
    removeAllChildren()
    drawGrid()
    drawFood()
    drawSnake()
    drawScore()
    drawGameOverIfNeeded()
  }

  private var tileSize: CGFloat {
    min(size.width, size.height) / CGFloat(gameState.gridSize)
  }

  private func rect(for point: GridPoint) -> CGRect {
    let boardSize = tileSize * CGFloat(gameState.gridSize)
    let originX = (size.width - boardSize) / 2
    let originY = (size.height - boardSize) / 2
    return CGRect(
      x: originX + CGFloat(point.x) * tileSize + tileInset,
      y: originY + CGFloat(gameState.gridSize - point.y - 1) * tileSize + tileInset,
      width: tileSize - (tileInset * 2),
      height: tileSize - (tileInset * 2)
    )
  }

  private func drawGrid() {
    for y in 0..<gameState.gridSize {
      for x in 0..<gameState.gridSize {
        let node = SKShapeNode(rect: rect(for: GridPoint(x: x, y: y)), cornerRadius: 3)
        node.strokeColor = theme.grid
        node.fillColor = .clear
        node.lineWidth = 0.5
        addChild(node)
      }
    }
  }

  private func drawSnake() {
    for (index, point) in gameState.snake.enumerated() {
      let node = SKShapeNode(rect: rect(for: point), cornerRadius: 5)
      node.strokeColor = .clear
      node.fillColor = index == 0 ? theme.snakeHead : theme.snakeBody
      addChild(node)
    }
  }

  private func drawFood() {
    let node = SKShapeNode(ellipseIn: rect(for: gameState.food))
    node.strokeColor = .clear
    node.fillColor = theme.food
    addChild(node)
  }

  private func drawScore() {
    let label = SKLabelNode(text: "Score \(gameState.score)")
    label.fontName = "AvenirNext-DemiBold"
    label.fontSize = 18
    label.fontColor = theme.text
    label.horizontalAlignmentMode = .left
    label.verticalAlignmentMode = .top
    label.position = CGPoint(x: 16, y: size.height - 16)
    addChild(label)
  }

  private func drawGameOverIfNeeded() {
    guard case .gameOver = gameState.status else {
      return
    }
    let label = SKLabelNode(text: "Game Over")
    label.fontName = "AvenirNext-Bold"
    label.fontSize = 34
    label.fontColor = theme.text
    label.position = CGPoint(x: size.width / 2, y: size.height / 2)
    addChild(label)
  }
}
