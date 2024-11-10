import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
const AudioRecorder = require('node-audiorecorder');
import { RecorderState, RecorderConfig } from '../types';
import { getRecorderConfig } from '../config/recorder';

export class RecordingService {
    private state: RecorderState = {
        recorder: undefined,
        fileStream: undefined
    };

    private getRecordingsPath(): string {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }
        return path.join(workspaceFolder.uri.fsPath, '.audible', 'comments');
    }

    private async ensureRecordingDirectory(): Promise<void> {
        const recordingsPath = this.getRecordingsPath();
        await fs.promises.mkdir(recordingsPath, { recursive: true });
    }

    private getNewAudioFilePath(): string {
        return path.join(this.getRecordingsPath(), `comment_${Date.now()}.wav`);
    }

    private initializeRecorder(config: RecorderConfig): typeof AudioRecorder {
        const recorder = new AudioRecorder(config);

        recorder
            .on('error', (err: Error) => {
                vscode.window.showErrorMessage(`Recording failed: ${err.message}`);
                this.stopRecording();
            })
            .on('end', () => {
                vscode.window.showInformationMessage('Comment saved successfully');
            });

        return recorder;
    }

    async startRecording(): Promise<void> {
        try {
            // Stop any existing recording
            if (this.state.recorder) {
                await this.stopRecording();
            }

            await this.ensureRecordingDirectory();
            const audioFilePath = this.getNewAudioFilePath();
            
            // Initialize recorder with config
            this.state.recorder = this.initializeRecorder(getRecorderConfig());
            this.state.fileStream = fs.createWriteStream(audioFilePath);
            
            // Start recording
            if (!this.state.recorder || !this.state.fileStream) {
                throw new Error('Failed to initialize recorder');
            }
            this.state.recorder.start().stream().pipe(this.state.fileStream);
            
            // Show recording indicator
            vscode.window.showInformationMessage('Recording started...', 'Stop Recording')
                .then(selection => {
                    if (selection === 'Stop Recording') {
                        this.stopRecording();
                    }
                });

        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to start recording: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    async stopRecording(): Promise<void> {
        try {
            if (this.state.recorder) {
                this.state.recorder.stop();
                this.state.recorder = undefined;
            }
            
            if (this.state.fileStream) {
                this.state.fileStream.end();
                this.state.fileStream = undefined;
            }

            vscode.window.showInformationMessage('Recording stopped');
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to stop recording: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    cleanup(): void {
        if (this.state.recorder) {
            this.stopRecording();
        }
    }
}