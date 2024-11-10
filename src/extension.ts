// src/extension.ts
import * as vscode from 'vscode';
import { RecordingService } from './services/recordingService';
import { registerCommands } from './commands';

let recordingService: RecordingService;

export function activate(context: vscode.ExtensionContext) {
    console.log('Audio Recording Extension is now active!');
    
    // Get the workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found. The audio recording extension requires a workspace.');
        return;
    }

    // Initialize the recording service with the workspace path
    recordingService = new RecordingService(workspaceFolder.uri.fsPath);
    registerCommands(context, recordingService);
}

export function deactivate() {
    if (recordingService) {
        recordingService.cleanup();
    }
}