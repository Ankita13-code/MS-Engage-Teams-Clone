import helpers from './helpers.js';

window.addEventListener('load', () => {
    const room = helpers.getQString(location.href, 'room');
    const username = sessionStorage.getItem('username');

    if (!room) {
        document.querySelector('#room-create').attributes.removeNamedItem('hidden');
    } else if (!username) {
        document.querySelector('#username-set').attributes.removeNamedItem('hidden');
        let headingDiv = document.getElementById('room-heading');
        headingDiv.innerHTML = `Join room: ${room}`;
    } else {
        let commElem = document.getElementsByClassName('room-comm');

        for (let i = 0; i < commElem.length; i++) {
            commElem[i].attributes.removeNamedItem('hidden');
        }

        var pc = [];

        let socket = io('/stream');

        var socketId = '';
        var myStream = '';
        var screen = '';
        var recordedStream = [];
        var mediaRecorder = '';

        //Get user video by default
        getAndSetUserStream();


        socket.on('connect', () => {
            //set socketId
            socketId = socket.io.engine.id;


            socket.emit('subscribe', {
                room: room,
                socketId: socketId
            });


            socket.on('new user', (data) => {
                socket.emit('newUserStart', { to: data.socketId, sender: socketId });
                pc.push(data.socketId);
                init(true, data.socketId);
            });


            socket.on('newUserStart', (data) => {
                pc.push(data.sender);
                init(false, data.sender);
            });


            socket.on('ice candidates', async(data) => {
                data.candidate ? await pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : '';
            });


            socket.on('sdp', async(data) => {
                if (data.description.type === 'offer') {
                    data.description ? await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description)) : '';

                    helpers.getFullUserMedia().then(async(stream) => {
                        if (!document.getElementById('local').srcObject) {
                            helpers.setLocalStream(stream);
                        }

                        //save my stream
                        myStream = stream;

                        stream.getTracks().forEach((track) => {
                            pc[data.sender].addTrack(track, stream);
                        });

                        let answer = await pc[data.sender].createAnswer();

                        await pc[data.sender].setLocalDescription(answer);

                        socket.emit('sdp', { description: pc[data.sender].localDescription, to: data.sender, sender: socketId });
                    }).catch((e) => {
                        console.error(e);
                    });
                } else if (data.description.type === 'answer') {
                    await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
                }
            });


            socket.on('chat', (data) => {
                helpers.addChat(data, 'remote');
            });

            socket.on('track', (data) => {
                sendName();
                helpers.addName((data), 'remote');
                console.log(data.sender);
            });
        });


        function getAndSetUserStream() {
            helpers.getFullUserMedia().then((stream) => {
                //save my stream
                myStream = stream;

                helpers.setLocalStream(stream);
            }).catch((e) => {
                console.error(`stream error: ${ e }`);
            });
        }


        function sendMsg(msg) {
            let data = {
                room: room,
                msg: msg,
                sender: username
            };

            //emit chat message
            socket.emit('chat', data);

            //add localchat
            helpers.addChat(data, 'local');
        }

        function sendName() {
            let data = {
                room: room,
                sender: username
            };

            socket.emit('track', data);
            helpers.addName(data, 'local');
        }



        function init(createOffer, partnerName) {
            pc[partnerName] = new RTCPeerConnection(helpers.getIceServer());

            if (screen && screen.getTracks().length) {
                screen.getTracks().forEach((track) => {
                    pc[partnerName].addTrack(track, screen); //should trigger negotiationneeded event
                });
            } else if (myStream) {
                myStream.getTracks().forEach((track) => {
                    pc[partnerName].addTrack(track, myStream); //should trigger negotiationneeded event
                });
            } else {
                helpers.getFullUserMedia().then((stream) => {
                    //save my stream
                    myStream = stream;

                    stream.getTracks().forEach((track) => {
                        pc[partnerName].addTrack(track, stream); //should trigger negotiationneeded event
                    });

                    helpers.setLocalStream(stream);
                }).catch((e) => {
                    console.error(`stream error: ${ e }`);
                });
            }



            //create offer
            if (createOffer) {

                pc[partnerName].onnegotiationneeded = async(e) => {

                    let offer = await pc[partnerName].createOffer();

                    await pc[partnerName].setLocalDescription(offer);

                    socket.emit('sdp', {
                        description: pc[partnerName].localDescription,
                        to: partnerName,
                        sender: socketId
                    });

                };
            }



            //send ice candidate to partnerNames
            pc[partnerName].onicecandidate = ({ candidate }) => {
                socket.emit('ice candidates', { candidate: candidate, to: partnerName, sender: socketId });
            };



            //add
            pc[partnerName].ontrack = (e) => {
                let str = e.streams[0];
                if (document.getElementById(`${ partnerName }-video`)) {
                    document.getElementById(`${ partnerName }-video`).srcObject = str;
                } else {
                    //video elem
                    let newVid = document.createElement('video');
                    newVid.id = `${ partnerName }-video`;
                    newVid.srcObject = str;
                    newVid.autoplay = true;
                    newVid.className = 'remote-video';

                    //video controls elements
                    let controlDiv = document.createElement('div');
                    controlDiv.className = 'remote-video-controls';
                    controlDiv.innerHTML = `<i class=" fa fa-lg fa-microphone text-white ml-5 pl-5 pr-4 mute-remote-mic" title="Mute incoming audio"></i>
                        <i class="fa fa-lg fa-expand text-white expand-remote-video" title="Full Screen Video"></i>`;

                    //create a new div for card
                    let cardDiv = document.createElement('div');
                    cardDiv.className = 'card card-sm';
                    cardDiv.id = partnerName;
                    cardDiv.appendChild(newVid);
                    cardDiv.appendChild(controlDiv);


                    //put div in main-section elem
                    document.getElementById('videos').appendChild(cardDiv);

                    helpers.adjustVideoElemSize();
                }
            };



            pc[partnerName].onconnectionstatechange = (d) => {
                switch (pc[partnerName].iceConnectionState) {
                    case 'disconnected':
                    case 'failed':
                        helpers.closeVideo(partnerName);
                        helpers.adjustVideoElemSize();
                        break;

                    case 'closed':
                        helpers.closeVideo(partnerName);
                        helpers.adjustVideoElemSize()
                        break;
                }
            };



            pc[partnerName].onsignalingstatechange = (d) => {
                switch (pc[partnerName].signalingState) {
                    case 'closed':
                        console.log("Signalling state is 'closed'");
                        helpers.closeVideo(partnerName);
                        helpers.adjustVideoElemSize();
                        break;
                    case 'stable':
                        console.log("ICE negotiation complete");
                        break;
                }
            };
        }



        function shareScreen() {
            helpers.shareScreen().then((stream) => {
                helpers.toggleShareIcons(true);

                //disable the video toggle btns while sharing screen. This is to ensure clicking on the btn does not interfere with the screen sharing
                //It will be enabled was user stopped sharing screen
                helpers.toggleVideoBtnDisabled(true);

                //save my screen stream
                screen = stream;

                //share the new stream with all partners
                broadcastNewTracks(stream, 'video', false);

                //When the stop sharing button shown by the browser is clicked
                screen.getVideoTracks()[0].addEventListener('ended', () => {
                    stopSharingScreen();
                });
            }).catch((e) => {
                console.error(e);
            });
        }



        function stopSharingScreen() {
            //enable video toggle btn
            helpers.toggleVideoBtnDisabled(false);

            return new Promise((res, rej) => {
                screen.getTracks().length ? screen.getTracks().forEach(track => track.stop()) : '';

                res();
            }).then(() => {
                helpers.toggleShareIcons(false);
                broadcastNewTracks(myStream, 'video');
            }).catch((e) => {
                console.error(e);
            });
        }



        function broadcastNewTracks(stream, type, mirrorMode = true) {
            helpers.setLocalStream(stream, mirrorMode);

            let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

            for (let p in pc) {
                let pName = pc[p];

                if (typeof pc[pName] == 'object') {
                    helpers.replaceTrack(track, pc[pName]);
                }
            }
        }


        function toggleRecordingIcons(isRecording) {
            let e = document.getElementById('record');

            if (isRecording) {
                e.setAttribute('title', 'Stop recording');
                // e.innerHTML = `${moment().format()}`
                e.classList.add('btn-recording');
                e.classList.remove('btn-record');
            } else {
                e.setAttribute('title', 'Record');
                e.classList.add('btn-record');
                e.classList.remove('btn-recording');
            }
        }


        function startRecording(stream) {
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: "video/webm;codecs=opus, vp8"
            });

            mediaRecorder.start(1000);
            toggleRecordingIcons(true);

            mediaRecorder.ondataavailable = function(e) {
                recordedStream.push(e.data);
            };

            mediaRecorder.onstop = function() {
                toggleRecordingIcons(false);

                helpers.saveRecordedStream(recordedStream, username);

                setTimeout(() => {
                    recordedStream = [];
                }, 3000);
            };

            mediaRecorder.onerror = function(e) {
                console.error(e);
            };
        }


        //Chat textarea
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.which === 13 && (e.target.value.trim())) {
                e.preventDefault();

                sendMsg(e.target.value);

                setTimeout(() => {
                    e.target.value = '';
                }, 50);
            }
        });


        //When the video icon is clicked
        document.getElementById('toggle-video').addEventListener('click', (e) => {
            e.preventDefault();

            let elem = document.getElementById('toggle-video');

            if (myStream.getVideoTracks()[0].enabled) {
                e.target.classList.remove('btn-video');
                e.target.classList.add('btn-video-off');
                elem.setAttribute('title', 'Show Video');

                myStream.getVideoTracks()[0].enabled = false;
            } else {
                e.target.classList.remove('btn-video-off');
                e.target.classList.add('btn-video');
                elem.setAttribute('title', 'Hide Video');

                myStream.getVideoTracks()[0].enabled = true;
            }

            broadcastNewTracks(myStream, 'video');
        });


        //When the mute icon is clicked
        document.getElementById('toggle-mute').addEventListener('click', (e) => {
            e.preventDefault();

            let elem = document.getElementById('toggle-mute');

            if (myStream.getAudioTracks()[0].enabled) {
                e.target.classList.remove('btn-mic');
                e.target.classList.add('btn-mute');
                elem.setAttribute('title', 'Unmute');

                myStream.getAudioTracks()[0].enabled = false;
            } else {
                e.target.classList.remove('btn-mute');
                e.target.classList.add('btn-mic');
                elem.setAttribute('title', 'Mute');

                myStream.getAudioTracks()[0].enabled = true;
            }

            broadcastNewTracks(myStream, 'audio');
        });


        //When user clicks the 'Share screen' button
        document.getElementById('share-screen').addEventListener('click', (e) => {
            e.preventDefault();

            if (screen && screen.getVideoTracks().length && screen.getVideoTracks()[0].readyState != 'ended') {
                stopSharingScreen();
            } else {
                shareScreen();
            }
        });


        //When record button is clicked
        document.getElementById('record').addEventListener('click', (e) => {
            /**
             * Ask user what they want to record.
             * Get the stream based on selection and start recording
             */
            if (!mediaRecorder || mediaRecorder.state == 'inactive') {
                helpers.toggleModal('recording-options-modal', true);
            } else if (mediaRecorder.state == 'paused') {
                mediaRecorder.resume();
            } else if (mediaRecorder.state == 'recording') {
                mediaRecorder.stop();
            }
        });


        //When user choose to record screen
        document.getElementById('record-screen').addEventListener('click', () => {
            helpers.toggleModal('recording-options-modal', false);

            if (screen && screen.getVideoTracks().length) {
                startRecording(screen);
            } else {
                helpers.shareScreen().then((screenStream) => {
                    startRecording(screenStream);
                }).catch((e) => {
                    console.log(e);
                });
            }
        });


        //When user choose to record own video
        document.getElementById('record-video').addEventListener('click', () => {
            helpers.toggleModal('recording-options-modal', false);

            if (myStream && myStream.getTracks().length) {
                startRecording(myStream);
            } else {
                helpers.getFullUserMedia().then((videoStream) => {
                    startRecording(videoStream);
                }).catch((e) => {
                    console.log(e);
                });
            }
        });
    }
});