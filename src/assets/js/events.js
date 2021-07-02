import helpers from './helpers.js';

window.addEventListener('load', () => {
    //When the chat icon is clicked
    document.querySelector('#toggle-chat-pane').addEventListener('click', (e) => {
        let chatElem = document.querySelector('#chat-pane');
        let mainSecElem = document.querySelector('#main-section');

        if (chatElem.classList.contains('box-opened')) {
            helpers.toggleInfoBtnDisabled(false);
            chatElem.setAttribute('hidden', true);
            mainSecElem.classList.remove('col-md-8');
            mainSecElem.classList.add('col-md-12');
            chatElem.classList.remove('box-opened');
            e.target.classList.add('btn-chat');
            e.target.classList.remove('btn-chat-on');
        } else {
            helpers.toggleInfoBtnDisabled(true);
            e.target.classList.add('btn-chat-on');
            e.target.classList.remove('btn-chat');
            chatElem.attributes.removeNamedItem('hidden');
            mainSecElem.classList.remove('col-md-12');
            mainSecElem.classList.add('col-md-8');
            chatElem.classList.add('box-opened');
        }

        //remove the 'New' badge on chat icon (if any) once chat is opened.
        setTimeout(() => {
            if (document.querySelector('#chat-pane').classList.contains('box-opened')) {
                helpers.toggleChatNotificationBadge();
            }
        }, 300);
    });


    //When show meeting info icon is clicked
    document.querySelector('#toggle-info').addEventListener('click', (e) => {
        e.preventDefault();
        let infoElem = document.querySelector('#info-pane');
        let meetLink = decodeURI(location.href);
        let linkElem = document.getElementById('meet-link');
        linkElem.innerHTML = meetLink;
        let mainSecElem = document.querySelector('#main-section');

        if (infoElem.classList.contains('box-opened')) {
            helpers.toggleChatBtnDisabled(false);
            infoElem.setAttribute('hidden', true);
            mainSecElem.classList.remove('col-md-8');
            mainSecElem.classList.add('col-md-12');
            infoElem.classList.remove('box-opened');
            e.target.classList.add('btn-meet-info');
            e.target.classList.remove('btn-meet-info-on');
        } else {
            linkElem.setAttribute('value', meetLink);
            helpers.toggleChatBtnDisabled(true);
            e.target.classList.add('btn-meet-info-on');
            e.target.classList.remove('btn-meet-info');
            infoElem.attributes.removeNamedItem('hidden');
            mainSecElem.classList.remove('col-md-12');
            mainSecElem.classList.add('col-md-8');
            infoElem.classList.add('box-opened');
        }

    });


    //When meet link is to be copied
    document.getElementById('copy-meet-info').addEventListener('click', (e) => {
        let copyBtn = document.getElementById('copy-meet-info');

        if (document.querySelector('#info-pane').classList.contains('box-opened')) {
            console.log('copied text')
            helpers.copyToClipboard();
            copyBtn.children[1].innerHTML = "Copied";
            copyBtn.style.color = "#27AE60";
        }
    });


    //When the video frame is clicked. This will enable picture-in-picture
    document.getElementById('local').addEventListener('click', () => {
        if (!document.pictureInPictureElement) {
            document.getElementById('local').requestPictureInPicture()
                .catch(error => {
                    // Video failed to enter Picture-in-Picture mode.
                    console.error(error);
                });
        } else {
            document.exitPictureInPicture()
                .catch(error => {
                    // Video failed to leave Picture-in-Picture mode.
                    console.error(error);
                });
        }
    });


    //When the 'Create room" is button is clicked
    document.getElementById('create-room').addEventListener('click', (e) => {
        e.preventDefault();

        let roomName = document.querySelector('#room-name').value;
        let yourName = document.querySelector('#your-name').value;

        if (roomName && yourName) {
            //remove error message, if any
            document.querySelector('#err-msg').innerHTML = "";

            //save the user's name in sessionStorage
            sessionStorage.setItem('username', yourName);

            //create room link
            let roomLink = `${ location.origin }?room=${ roomName.trim().replace( ' ', '_' ) }_${ helpers.generateRandomString() }`;

            //show message with link to room
            document.querySelector('#room-created').innerHTML = `Room successfully created. Click <a href='${ roomLink }'>here</a> to enter room. 
                Share the room link with your peers.`;

            //empty the values
            document.querySelector('#room-name').value = '';
            document.querySelector('#your-name').value = '';
        } else {
            document.querySelector('#err-msg').innerHTML = "All fields are required";
        }
    });


    //When the 'Enter room' button is clicked.
    document.getElementById('enter-room').addEventListener('click', (e) => {
        e.preventDefault();

        let name = document.querySelector('#username').value;

        if (name) {
            //remove error message, if any
            document.querySelector('#err-msg-username').innerHTML = "";

            //save the user's name in sessionStorage
            sessionStorage.setItem('username', name);

            //reload room
            location.reload();
        } else {
            document.querySelector('#err-msg-username').innerHTML = "Please input your name";
        }
    });


    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('expand-remote-video')) {
            helpers.maximiseStream(e);
        } else if (e.target && e.target.classList.contains('mute-remote-mic')) {
            helpers.singleStreamToggleMute(e);
        }
    });


    document.getElementById('closeModal').addEventListener('click', () => {
        helpers.toggleModal('recording-options-modal', false);
    });
});