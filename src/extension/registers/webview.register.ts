import { setupHtml } from '@extension/utils'
import { setupWebviewAPIManager } from '@extension/webview-api'
import * as vscode from 'vscode'

import { BaseRegister } from './base.register'

export class AideWebViewProvider {
  static readonly viewType = 'aide.webview'

  private webviewPanel: vscode.WebviewPanel | undefined

  private sidebarView: vscode.WebviewView | undefined

  private disposes: vscode.Disposable[] = []

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext
  ) {}

  async resolveSidebarView(webviewView: vscode.WebviewView) {
    this.sidebarView = webviewView
    await this.setupWebview(webviewView)
  }

  async createOrShowWebviewPanel() {
    if (this.webviewPanel) {
      this.webviewPanel.reveal(vscode.ViewColumn.Beside)
    } else {
      this.webviewPanel = vscode.window.createWebviewPanel(
        AideWebViewProvider.viewType,
        'AIDE',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [this.extensionUri]
        }
      )
      await this.setupWebview(this.webviewPanel)

      this.webviewPanel.onDidDispose(
        () => {
          this.webviewPanel = undefined
        },
        null,
        this.context.subscriptions
      )
    }
  }

  private async setupWebview(
    webview: vscode.WebviewView | vscode.WebviewPanel
  ) {
    this.cleanUp()

    const setupWebviewAPIManagerDispose = await setupWebviewAPIManager(
      this.context,
      webview
    )
    this.disposes.push(setupWebviewAPIManagerDispose)

    if ('options' in webview.webview) {
      webview.webview.options = {
        enableScripts: true,
        localResourceRoots: [this.extensionUri]
      }
    }
    webview.webview.html = this.getHtmlForWebview(webview.webview)
  }

  revealSidebar() {
    this.sidebarView?.show?.(true)
  }

  private getHtmlForWebview(webview: vscode.Webview) {
    return setupHtml(webview, this.context)
  }

  cleanUp() {
    this.disposes.forEach(dispose => dispose.dispose())
    this.disposes = []
  }
}

export class WebviewRegister extends BaseRegister {
  private provider: AideWebViewProvider | undefined

  async register(): Promise<void> {
    this.provider = new AideWebViewProvider(
      this.context.extensionUri,
      this.context
    )

    const disposable = vscode.window.registerWebviewViewProvider(
      AideWebViewProvider.viewType,
      {
        resolveWebviewView: webviewView =>
          this.provider!.resolveSidebarView(webviewView)
      }
    )
    this.context.subscriptions.push(disposable)

    this.registerManager.commandManager.registerService(
      'AideWebViewProvider',
      this.provider
    )

    this.provider.revealSidebar()
  }
}
