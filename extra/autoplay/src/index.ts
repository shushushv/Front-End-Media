import { createCanvasStream, logger } from './utils';
import { autoplayInWechat } from './wechat-autoplay';

const videoEl = document.getElementById('video')! as HTMLVideoElement;
const mediaStreamVideoEl = document.getElementById('mediastream-video')! as HTMLVideoElement;
const audioEl = document.querySelector('audio')!;
const result = document.querySelector('#result')!;
const playBtnSync = document.querySelector('#play-btn-sync')! as HTMLButtonElement;
const playBtnAsync = document.querySelector('#play-btn-async')! as HTMLButtonElement;
const ua = document.querySelector('#ua')!;
const getDeviceSwitch = document.querySelector('#get-device-switch')!;

const enableGetUserMedia = !!(new URLSearchParams(location.search)).get('getusermedia');
if (enableGetUserMedia) {
	getDeviceSwitch.innerHTML = 'disable getUserMedia(before play)';
} else {
	getDeviceSwitch.innerHTML = 'enable getUserMedia(before play)';
}

ua.innerHTML = 'UA: ' + navigator.userAgent;

getDeviceSwitch.addEventListener('click', () => {
	const params = new URLSearchParams(location.search);
	enableGetUserMedia ? params.delete('getusermedia') : params.set('getusermedia', '1');
	location.search = params.toString();
});

playBtnSync.addEventListener('click', () => {
	play();
});

playBtnAsync.addEventListener('click', async () => {
	await new Promise((resolve) => setTimeout(resolve, 200));
	await play();
});

const play = async () => {
	Promise.allSettled([playVideo(), playMediaStreamVideo(), playAudio()]).then((results) => {
		result.innerHTML = results
			.map((item, idx) => {
				let result = ['【video】', '【mediastream-video】', '【audio】'][idx];
				if (item.status === 'fulfilled') {
					result += ' autoplay success.';
					typeof item.value === 'string' && (result += ` ${item.value}`);
				} else {
					playBtnSync.disabled = false;
					playBtnAsync.disabled = false;
					result += ` autoplay failed. <br>reason: ${item.reason}`;
				}
				return `<li>${result}</li>`;
			})
			.join('<br/>');
	});
};

const playVideo = async () => {
	logger('playVideo()', 'start');
	videoEl.src = './video.mp4';
	return videoEl.play().catch(async (e) => {
		logger('playVideo()', 'failed', e.name);
		if (e.name === 'NotAllowedError') {
			return autoplayInWechat(videoEl).catch(() => Promise.reject(e));
		}
		throw e;
	});
};

const playAudio = async () => {
	logger('playAudio()', 'start');
	audioEl.src = './audio.mp3';
	return audioEl.play().catch(async (e) => {
		logger('playAudio()', 'failed', e.name);
		if (e.name === 'NotAllowedError') {
			return autoplayInWechat(audioEl).catch(() => Promise.reject(e));
		}
		throw e;
	});
};

const playMediaStreamVideo = async () => {
  logger('playMediaStreamVideo()', 'start');
  const { stream, stop } = createCanvasStream({
    width: 640,
    height: 320,
    fps: 30,
  });
  mediaStreamVideoEl.srcObject = stream;
  return mediaStreamVideoEl.play().catch(async (e) => {
    logger('playCanVideo()', 'failed', e.name);
    if (e.name === 'NotAllowedError') {
      return autoplayInWechat(mediaStreamVideoEl).catch(() => Promise.reject(e));
    }
    throw e;
  });
};

if (enableGetUserMedia) {
	navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(() => {
		play();
	});
} else {
	play();
}
