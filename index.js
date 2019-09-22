const gpio = require('rpi-gpio');
const { exec, spawn } = require('child_process');
const gpiop = gpio.promise;

const playPauseCommand = 'dbus-send --type=method_call --dest=org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.PlayPause';
const playCommand = 'dbus-send --type=method_call --dest=org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.Play';
const pauseCommand = 'dbus-send --type=method_call --dest=org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.Pause';
const rewindCommand = 'dbus-send --type=method_call --dest=org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.Seek int64:"-100000000"';
const vlcCommand = ['vlc', ['-R', '-f', '/home/pi/Downloads/sample-video.mp4']];

const vlc = {
	start: () => spawn(...vlcCommand),
	playPause: () => exec(playPauseCommand),
	play: () => exec(playCommand),
	pause: () => exec(pauseCommand),
	rewind: () => exec(`${rewindCommand};${playCommand};sleep 0.1;${pauseCommand}`),
};

const channels = [
	{
		pin: 3,
		name: 'Play/Pause toggle',
		value: true,
		clearId: null,
		fn: () => vlc.playPause(),
	}, {
		pin: 5,
		name: 'Play',
		value: true,
		clearId: null,
		fn: () => vlc.play(),
	}, {
		pin: 13,
		name: 'Pause toggle',
		value: true,
		clearId: null,
		fn: () => vlc.pause(),
	}, {
		pin: 7,
		name: 'Rewind',
		value: true,
		clearId: null,
		fn: () => vlc.rewind(),
	},
];

const main = async () => {
	// Setup all pins
	await Promise.all(channels.map(c => {
		return gpiop.setup(c.pin, gpio.DIR_IN, gpio.EDGE_BOTH);
	}));
	
	// Handle changes
	gpio.on('change', (channel, value) => {
		const found = channels.find(c => c.pin === channel);
		if (found) {
			if (value !== found.value) {
				found.value = value;
				if (found.clearId) {
					clearTimeout(found.clearId);
				}
				found.clearId = setTimeout(() => {
					found.clearId = null;
					if (value === false) {
						console.log(found.name);
						found.fn();
					}
				}, 100);
			}
		}
	});
};

vlc.start();
main();

//gpiop.destroy();

