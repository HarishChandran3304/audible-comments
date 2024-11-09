import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
const AudioRecorder = require('node-audiorecorder');

let currentRecorder: typeof AudioRecorder | undefined;
let currentFileStream: fs.WriteStream | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Audio Recording Extension is now active!');

    let startRecordingCommand = vscode.commands.registerCommand('audible-comments.startRecording', async () => {
        try {
            // Stop any existing recording
            if (currentRecorder) {
                await stopRecording();
            }

            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const recordingsPath = path.join(workspaceFolder.uri.fsPath, '.audible');
            await fs.promises.mkdir(recordingsPath, { recursive: true });

            const audioFileName = path.join(recordingsPath, `recording_${Date.now()}.wav`);
            
            // Initialize recorder with proper options
            currentRecorder = new AudioRecorder({
                program: process.platform === 'win32' ? 'sox' : 'rec',    // Use 'rec' on Unix-like systems
                bits: 16,                                                  // Sample size
                channels: 1,                                              // Number of channels
                encoding: 'signed-integer',                               // Encoding type
                rate: 44100,                                             // Sample rate
                type: 'wav',                                             // Format type
                silence: 0
            });

            // Handle recording events
            currentRecorder
                .on('error', (err: Error) => {
                    vscode.window.showErrorMessage(`Recording failed: ${err.message}`);
                    stopRecording();
                })
                .on('end', () => {
                    vscode.window.showInformationMessage('Recording saved successfully');
                });

            // Create write stream
            currentFileStream = fs.createWriteStream(audioFileName);
            
            // Start recording
            currentRecorder.start().stream().pipe(currentFileStream);
            
            // Show recording indicator
            vscode.window.showInformationMessage('Recording started...', 'Stop Recording')
                .then(selection => {
                    if (selection === 'Stop Recording') {
                        stopRecording();
                    }
                });

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    let stopRecordingCommand = vscode.commands.registerCommand('audible-comments.stopRecording', stopRecording);

    context.subscriptions.push(startRecordingCommand, stopRecordingCommand);
}

async function stopRecording(): Promise<void> {
    try {
        if (currentRecorder) {
            currentRecorder.stop();
            currentRecorder = undefined;
        }
        
        if (currentFileStream) {
            currentFileStream.end();
            currentFileStream = undefined;
        }

        vscode.window.showInformationMessage('Recording stopped');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to stop recording: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export function deactivate() {
    if (currentRecorder) {
        stopRecording();
    }
}