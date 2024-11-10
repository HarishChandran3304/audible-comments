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