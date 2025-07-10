import { logger } from './utils';

declare global {
	interface Window {
		WeixinJSBridge?: {
			invoke: (method: string, data: any, callback: () => void) => void;
		};
	}
}

const isWechat = () => {
	return /micromessenger/i.test(navigator.userAgent);
};

const isAndroid = () => {
	return /android/i.test(navigator.userAgent);
};

export const autoplayInWechat = async (media: HTMLMediaElement): Promise<string> => {
	if (!isWechat()) {
		return Promise.reject();
	}
	logger('autoplayInWechat()', 'start');

	if (isAndroid() && media instanceof HTMLAudioElement) {
		const audioContext = new AudioContext();
		if (audioContext.state === 'running') {
			logger('autoplayInWechat()', `use audioContext to play audio`);
			const source = audioContext.createMediaElementSource(media);
			source.connect(audioContext.destination);
			return audioContext.resume().then(() => 'use AudioContext');
		}
	}

	return new Promise<string>((resolve, reject) => {
		const resume = () => {
			window.WeixinJSBridge?.invoke?.('getNetworkType', {}, () => {
				logger('autoplayInWechat()', `use WeixinJSBridge to play ${media.tagName}`);
				media.play().then(() => resolve('use WeixinJSBridge')).catch(reject);
			});
			document.removeEventListener('WeixinJSBridgeReady', resume);
		};
		if (window.WeixinJSBridge) {
			resume();
		} else {
			document.addEventListener('WeixinJSBridgeReady', resume);
		}
	});
};
