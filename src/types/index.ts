import AudioRecorder from 'node-audiorecorder';
import * as fs from 'fs';

export interface RecorderState {
    recorder: AudioRecorder | undefined;
    fileStream: fs.WriteStream | undefined;
}

export interface RecorderConfig {
    program: string;
    bits: number;
    channels: number;
    encoding: string;
    rate: number;
    type: string;
    silence: number;
}

export interface AudioPosition {
    line: number;
    character: number;
}

export interface AudioMetadata {
    id: string;
    fileName: string;
    filePath: string;
    position: AudioPosition;
    audioFile: string;
    timestamp: number;
    duration?: number;
}

export interface AudioDataStore {
    // recordings: AudioMetadata[];
    comments: AudioMetadata[];
    version: string;
}