import { RecorderConfig } from '../types';
import * as process from 'process';

export const getRecorderConfig = (): RecorderConfig => ({
    program: process.platform === 'win32' ? 'sox' : 'rec',
    bits: 16,
    channels: 1,
    encoding: 'signed-integer',
    rate: 44100,
    type: 'wav',
    silence: 0
});