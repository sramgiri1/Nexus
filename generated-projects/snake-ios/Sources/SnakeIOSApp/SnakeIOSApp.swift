import SpriteKit
import SwiftUI

public struct SnakeIOSRootView: View {
  private let sceneSize: CGSize

  public init(sceneSize: CGSize = CGSize(width: 390, height: 844)) {
    self.sceneSize = sceneSize
  }

  public var body: some View {
    SpriteView(scene: SnakeGameScene(size: sceneSize))
      .ignoresSafeArea()
      .background(Color.black)
      .accessibilityLabel("Snake game board")
  }
}
