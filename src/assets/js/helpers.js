export default {
    generateRandomString() {
        const crypto = window.crypto || window.msCrypto;
        let array = new Uint32Array(1);

        return crypto.getRandomValues(array);
    },


    closeVideo(elemId) {
        if (document.getElementById(elemId)) {
            document.getElementById(elemId).remove();
            this.adjustVideoElemSize();
        }
    },


    pageHasFocus() {
        return !(document.hidden || document.onfocusout || window.onpagehide || window.onblur);
    },


    getQString(url = '', keyToReturn = '') {
        url = url ? url : location.href;
        let queryStrings = decodeURIComponent(url).split('#', 2)[0].split('?', 2)[1];

        if (queryStrings) {
            let splittedQStrings = queryStrings.split('&');

            if (splittedQStrings.length) {
                let queryStringObj = {};

                splittedQStrings.forEach(function(keyValuePair) {
                    let keyValue = keyValuePair.split('=', 2);

                    if (keyValue.length) {
                        queryStringObj[keyValue[0]] = keyValue[1];
                    }
                });

                return keyToReturn ? (queryStringObj[keyToReturn] ? queryStringObj[keyToReturn] : null) : queryStringObj;
            }

            return null;
        }

        return null;
    },


    userMediaAvailable() {
        return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    },


    getUserFullMedia() {
        if (this.userMediaAvailable()) {
            return navigator.mediaDevices.getUserMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
        } else {
            throw new Error('User media not available');
        }
    },


    getUserAudio() {
        if (this.userMediaAvailable()) {
            return navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
        } else {
            throw new Error('User media not available');
        }
    },



    shareScreen() {
        if (this.userMediaAvailable()) {
            return navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
        } else {
            throw new Error('User media not available');
        }
    },


    getIceServer() {
        return {
            iceServers: [{
                    urls: ["stun:3.7.35.255:443",
                        "stun:stun.l.google.com:19302",
                    ]
                },
                {
                    username: "ankitapareek2000@gmail.com",
                    credential: "EWwTZNTstG7LR.q",
                    urls: [
                        "turn:numb.viagenie.ca"
                    ]
                }

            ]
        };
    },

    addName(data, senderType) {
        let cardDiv = document.getElementsByClassName('card-sm');
        let nameDiv = document.createElement('div');
        let senderName = 'You';

        if (senderType === 'remote') {
            senderName = data.sender;
        }

        nameDiv.innerHTML = `<span class='text-white'>${senderName}</span>`

        cardDiv.appendChild(nameDiv);

    },


    addChat(data, senderType) {
        let chatMsgDiv = document.querySelector('#chat-messages');
        let senderName = 'You';
        let msgBg = 'local-bg';

        if (senderType === 'remote') {

            senderName = data.sender;
            msgBg = 'remote-bg';

            this.toggleChatNotificationBadge();
        }

        let infoDiv = document.createElement('div');
        infoDiv.className = 'sender-info';
        infoDiv.innerHTML = `${ senderName } - ${moment().format( 'h:mm a' ) }`;

        let colDiv = document.createElement('div');
        colDiv.className = `col-12 card chat-card ${ msgBg } msg ml-2 mt-1 mb-1`;
        colDiv.innerHTML = xssFilters.inHTMLData(data.msg).autoLink({ target: "_blank", rel: "nofollow" });

        let rowDiv = document.createElement('div');
        rowDiv.className = `row msg-row mb-1`;


        colDiv.appendChild(infoDiv);
        rowDiv.appendChild(colDiv);

        chatMsgDiv.appendChild(rowDiv);

        /**
         * Move focus to the newly added message but only if:
         * 1. Page has focus
         * 2. User has not moved scrollbar upward. This is to prevent moving the scroll position if user is reading previous messages.
         */
        if (this.pageHasFocus) {
            rowDiv.scrollIntoView();
        }
    },


    toggleChatNotificationBadge() {
        if (document.querySelector('#chat-pane').classList.contains('box-opened')) {
            document.querySelector('#new-chat-notification').setAttribute('hidden', true);
        } else {
            document.querySelector('#new-chat-notification').removeAttribute('hidden');
        }
    },



    replaceTrack(stream, recipientPeer) {
        let sender = recipientPeer.getSenders ? recipientPeer.getSenders().find(s => s.track && s.track.kind === stream.kind) : false;

        sender ? sender.replaceTrack(stream) : '';
    },



    toggleShareIcons(share) {
        let shareIconElem = document.querySelector('#share-screen');

        if (share) {
            shareIconElem.setAttribute('title', 'Stop sharing screen');
            shareIconElem.classList.add('btn-share-screen-on');
            shareIconElem.classList.remove('btn-share-screen');
        } else {
            shareIconElem.setAttribute('title', 'Share screen');
            shareIconElem.classList.add('btn-share-screen');
            shareIconElem.classList.remove('btn-share-screen-on');
        }
    },


    toggleVideoBtnDisabled(disabled) {
        document.getElementById('toggle-video').disabled = disabled;
    },

    toggleInfoBtnDisabled(disabled) {
        document.getElementById('toggle-info').disabled = disabled;
    },

    toggleChatBtnDisabled(disabled) {
        document.getElementById('toggle-chat-pane').disabled = disabled;
    },

    copyToClipboard() {
        var dummyInput = document.createElement('input');
        let text = decodeURI(window.location.href);

        document.body.appendChild(dummyInput);
        dummyInput.value = text;
        dummyInput.select();
        document.execCommand('copy');
        document.body.removeChild(dummyInput);
    },


    maximiseStream(e) {
        let elem = e.target.parentElement.previousElementSibling;

        elem.requestFullscreen() || elem.mozRequestFullScreen() || elem.webkitRequestFullscreen() || elem.msRequestFullscreen();
    },


    singleStreamToggleMute(e) {
        if (e.target.classList.contains('fa-microphone')) {
            e.target.parentElement.previousElementSibling.muted = true;
            e.target.classList.add('fa-microphone-slash');
            e.target.classList.remove('fa-microphone');
        } else {
            e.target.parentElement.previousElementSibling.muted = false;
            e.target.classList.add('fa-microphone');
            e.target.classList.remove('fa-microphone-slash');
        }
    },


    saveRecordedStream(stream, user) {
        let blob = new Blob(stream, { type: 'video/webm' });

        let file = new File([blob], `${ user }-${ moment().unix() }-record.webm`);

        saveAs(file);
    },


    toggleModal(id, show) {
        let el = document.getElementById(id);

        if (show) {
            el.removeAttribute('hidden');
        } else {
            el.setAttribute('hidden', true);
        }
    },



    setLocalStream(stream, mirrorMode = true) {
        const localVidElem = document.getElementById('local');

        localVidElem.srcObject = stream;
        mirrorMode ? localVidElem.classList.add('mirror-mode') : localVidElem.classList.remove('mirror-mode');
    },


    adjustVideoElemSize() {
        let elem = document.getElementsByClassName('card-sm');
        let totalRemoteVideosDesktop = elem.length;
        let newWidth = totalRemoteVideosDesktop <= 1 ? '100%' : (
            totalRemoteVideosDesktop == 2 ? '50%' : (
                totalRemoteVideosDesktop == 3 ? '33.33%' : (
                    totalRemoteVideosDesktop <= 8 ? '25%' : (
                        totalRemoteVideosDesktop <= 15 ? '20%' : (
                            totalRemoteVideosDesktop <= 18 ? '16%' : (
                                totalRemoteVideosDesktop <= 23 ? '15%' : (
                                    totalRemoteVideosDesktop <= 32 ? '12%' : '10%'
                                )
                            )
                        )
                    )
                )
            )
        );


        for (let i = 0; i < totalRemoteVideosDesktop; i++) {
            elem[i].style.width = newWidth;
        }
    },



};