const signupBtn = document.querySelector('.create');
const loginBtn = document.querySelector('.login-btn');
const userInputSignup = document.querySelector('.username-signup');
const passwordInputSignup = document.querySelector('.password-signup');
const confirmPassword = document.querySelector('.confirm-password');
const userInputLogin = document.querySelector('.username-login');
const passwordInputLogin = document.querySelector('.password-login');
const logout = document.querySelector('.logout');
const postBtn = document.querySelector('.send');
const chatInput = document.querySelector('.chat-input');
const userMessaging = document.querySelector('.user-messaging')
let chosenFriend = null;
let messagesArray = []
let state = []
let cooldown;
let cooldown2;
let socket =  null
// http://localhost:8080
let requestsArray = []
let friendsArray = []
function requests() {
    document.querySelector('.requests').innerHTML = '';
    requestsArray.forEach(request => {
        if (request.from == document.querySelector('.profile-name').textContent) {
        const pendingRequest = document.createElement('div')
        const profileName2 = document.createElement('span')
        const state = document.createElement('aside')
        const decline = document.createElement('button')
        decline.innerHTML = '<svg class="declined" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"/></svg>'
        pendingRequest.classList.add('pending-requests')
        profileName2.classList.add('profile-name2')
        state.classList.add('state')
        decline.classList.add('decline')
        profileName2.textContent = request.to
        state.textContent = 'pending...'
        decline.addEventListener('click', () => {
            socket.send(JSON.stringify({
                type: 'response-to-request',
                to: request.to,
                state: "declined"
            }))
        })
        document.querySelector('.requests').append(pendingRequest);
        pendingRequest.append(profileName2, state, decline);
        } else {
        const optionRequest = document.createElement('div')
        const profileName2 = document.createElement('span')
        const state = document.createElement('aside')
        const accept = document.createElement('button')
        const decline = document.createElement('button')
        optionRequest.classList.add('option-requests')
        profileName2.classList.add('profile-name2')
        state.classList.add('state')
        accept.classList.add('accept')
        decline.classList.add('decline')
        accept.innerHTML = '<svg class="accepted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z"/></svg>'
        decline.innerHTML = '<svg class="declined" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"/></svg>'
        profileName2.textContent = request.from
        accept.addEventListener('click', () => {
            socket.send(JSON.stringify({
                type: 'response-to-request',
                to: request.from,
                state: "accepted"
            }))
        })
        decline.addEventListener('click', () => {
            socket.send(JSON.stringify({
                type: 'response-to-request',
                to: request.from,
                state: "declined"
            }))
        })
        document.querySelector('.requests').append(optionRequest);
        optionRequest.append(profileName2, state)
        state.append(accept, decline)
        }
    })
}
let sameUser = null
let oldDate = null
function friends(states) {
    document.querySelector('.friends').innerHTML = '';
    friendsArray.forEach(async (friend) => {
        const friendBtn = document.createElement('button');
        const profilePic = document.createElement('div')
        const friendName = document.createElement('span');
        const status = document.createElement('div');
        const edit = document.createElement('div');
        const editMenu = document.createElement('div');
        editMenu.classList.add('edit-menu')
        editMenu.innerHTML = 'Remove user <svg class="delete" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320z"/></svg>';
        edit.innerHTML = '<svg class="edit" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M96 160C96 142.3 110.3 128 128 128L512 128C529.7 128 544 142.3 544 160C544 177.7 529.7 192 512 192L128 192C110.3 192 96 177.7 96 160zM96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320zM544 480C544 497.7 529.7 512 512 512L128 512C110.3 512 96 497.7 96 480C96 462.3 110.3 448 128 448L512 448C529.7 448 544 462.3 544 480z"/></svg>'
        friendBtn.classList.add('friend');
        friendName.classList.add('friend-name');
        profilePic.classList.add('profile-pic2');
        status.classList.add('status');
        friendName.textContent = friend.username;
        profilePic.style.background = friend.color
        profilePic.textContent = friend.username;
        profilePic.textContent = profilePic.textContent.toUpperCase().slice(0, 1);
        friendBtn.addEventListener('click', async (e) => {
            if (e.target.closest('.edit') || e.target.closest('.edit-menu')) return;
            chosenFriend = friend.username; 
            let res = await fetch(`https://chatme-production-1e37.up.railway.app/api/users/${chosenFriend}`, {
                method: 'GET',
                credentials: 'include'
            })
            let data = await res.json()
            if (window.innerWidth > 800) {
            document.querySelector('.chat-tab').classList.add('chosen')
            document.querySelector('.live-chat').classList.add('chosen')
            } else {
                document.querySelector('.chat-area').classList.add('msg')
                userMessaging.textContent = friend.username; 
            }
            messagesArray = data
            sameUser = null
            messages()
            document.querySelector('.live-chat').scrollBy({
            top: document.querySelector('.live-chat').scrollHeight
        })
        });
        edit.addEventListener('click', () => {
            document.querySelectorAll('.edit-menu').forEach(menu => {
                menu.classList.remove('toggle');
            })
            chosenFriend = friend.username;
            editMenu.classList.toggle('toggle');
        })
        editMenu.addEventListener('click', () => {
            socket.send(JSON.stringify({
                type: "end-friendship",
                to: chosenFriend
            }));
        })
        document.querySelector('.friends').append(friendBtn);
        friendBtn.append(profilePic, friendName, status, edit, editMenu);
        let res = await fetch('https://chatme-production-1e37.up.railway.app/api/friends', {
        method: 'GET',
        credentials: 'include'
    });
    let data = await res.json();
    data.forEach(user =>  {
        if (friend.username == user.username && user.status == 'online') {
            status.style.background = 'rgb(38, 240, 38)'
        }
    })
    if (states == null) return;
    states.forEach(one => {
        if (one.user == friend.username && one.status == 'online') {
            status.style.background = 'rgb(38, 240, 38)'
        }
    })
    })
};
function messages() {
    document.querySelector('.live-chat').innerHTML = '';
    messagesArray.forEach(message => {
        const textArea = document.createElement('main')
        const userText = document.createElement('aside')
        const nameText = document.createElement('span')
        const dateText = document.createElement('span')
        const text = document.createElement('article')
        const profilePic = document.createElement('div')
        textArea.classList.add('text-area')
        userText.classList.add('user-text')
        nameText.classList.add('name-text')
        dateText.classList.add('date-text')
        text.classList.add('text')
        profilePic.classList.add('profile-pic')
        if (message.from == sameUser && oldDate == message.date) {
            userText.style.display = 'none'
            textArea.style.marginBottom = '-35px'
            text.style.marginTop = '-75px'
            textArea.style.paddingBottom = '35px'
        }
        sameUser = message.from
        oldDate = message.date
        profilePic.textContent = message.from.toUpperCase().slice(0, 1)
        profilePic.style.background = message.color
        nameText.textContent = message.from
        dateText.textContent = message.date
        text.textContent = message.text
        document.querySelector('.live-chat').append(textArea);
        textArea.append(userText, text);
        userText.append(profilePic, nameText, dateText)
        }
  )
}

function errorMsg(text) {
    clearTimeout(cooldown);
        document.querySelector('.error-msg').textContent = text
        document.querySelector('.error-msg').classList.add('throw');
        cooldown = setTimeout(() => {
            document.querySelector('.error-msg').classList.remove('throw')
        }, 5000)
}

signupBtn.addEventListener('click', async () => {
    try {
    if (userInputSignup.value.trim() === '' ||  passwordInputSignup.value.trim() === '' || confirmPassword.value.trim() === '') { errorMsg('Include username and password!'); return; }
    if (userInputSignup.value.trim().match(/[^\w+]/) || userInputSignup.value.trim().includes('+')) { errorMsg('Cannot use special characters!'); return; }
    if (userInputSignup.value.length <= 3) { errorMsg('Username must be longer!'); return; }
    if (userInputSignup.value.length > 14) { errorMsg('Username is too long!'); return; }
    if (passwordInputSignup.value.length > 15) { errorMsg('Password is too long!'); return; }
    if (passwordInputSignup.value.length < 5) { errorMsg('Password is not long enough!'); return; }
    if (passwordInputSignup.value !== confirmPassword.value) { errorMsg('Passwords do not match!'); return; }
    let res = await fetch('https://chatme-production-1e37.up.railway.app/api/users/signup', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: userInputSignup.value,
            password: passwordInputSignup.value
        })
    })
    if (!res.ok) {
        errorMsg('Username already exists!');
    } else {
        let data = await res.json();
        socketConnection()
        document.querySelector('.profile-name').textContent = data.username;
        document.querySelector('.live-chat').innerHTML = ''
        document.querySelector('.profile-pic3').style.background = data.color;
        document.querySelector('.profile-pic3').textContent = data.username.toUpperCase().slice(0, 1);
        document.querySelector('.error-msg').classList.remove('throw')
        document.querySelector('.friends').innerHTML = ''
        document.querySelector('.signup').style.display = 'none'
        document.querySelector('.home').style.display = 'block'
    }
   } catch(error) {
    console.log(error)
   }
})

function errorMsg2 (text) {
    clearTimeout(cooldown2);
        document.querySelector('.error-msg2').textContent = text
        document.querySelector('.error-msg2').classList.add('throw');
        cooldown2 = setTimeout(() => {
            document.querySelector('.error-msg2').classList.remove('throw')
        }, 5000)
}

loginBtn.addEventListener('click', async () => {
    if (userInputLogin.value.trim() === '' ||  passwordInputLogin.value.trim() === '') { errorMsg2('Include username and password!'); return; };
    let res = await fetch('https://chatme-production-1e37.up.railway.app/api/users/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: userInputLogin.value,
            password: passwordInputLogin.value
        })
    })
    if (!res.ok) {
        errorMsg2('Incorrect username or password!')
    } else {
        let data = await res.json();
        socketConnection()
        document.querySelector('.profile-name').textContent = data.username;
        document.querySelector('.live-chat').innerHTML = ''
        requestsArray = data.requests
        requests();
        friendsArray = data.friends
        friends();
        document.querySelector('.profile-pic3').style.background = data.color;
        document.querySelector('.profile-pic3').textContent = data.username.toUpperCase().slice(0, 1);
        document.querySelector('.error-msg2').classList.remove('throw')
        document.querySelector('.login').style.display = 'none'
        document.querySelector('.home').style.display = 'block'
    }
})

document.querySelector('.remove-data').addEventListener('click', async () => {
    document.querySelector('.signup').style.display = 'block'
    document.querySelector('.home').style.display = 'none'
    document.querySelector(".manage").classList.remove('appear')
    userInputSignup.value = '';
    passwordInputSignup.value = '';
    userInputLogin.value = '';
    passwordInputLogin.value = '';
    confirmPassword.value = '';
    document.querySelector('.chat-tab').classList.remove('chosen')
    document.querySelector('.live-chat').classList.remove('chosen')
    socket.send(JSON.stringify({
        type: 'logout'
    }));
    let res = await fetch('https://chatme-production-1e37.up.railway.app/api/users/fullDelete', {
        method: 'DELETE',
        credentials: 'include'
    });
    disconnectSocket()
})


document.querySelector('.go-to-login').addEventListener('click', () => {
    document.querySelector('.signup').style.display = 'none'
    document.querySelector('.login').style.display = 'block'
    userInputSignup.value = '';
    passwordInputSignup.value = '';
})

document.querySelector('.make-an-account').addEventListener('click', () => {
    document.querySelector('.signup').style.display = 'block'
    document.querySelector('.login').style.display = 'none'
    userInputLogin.value = '';
    passwordInputLogin.value = '';
})

logout.addEventListener("click", async () => {
    document.querySelector('.signup').style.display = 'block'
    document.querySelector('.home').style.display = 'none'
    document.querySelector(".manage").classList.remove('appear')
    userInputSignup.value = '';
    passwordInputSignup.value = '';
    userInputLogin.value = '';
    passwordInputLogin.value = '';
    confirmPassword.value = '';
    document.querySelector('.chat-tab').classList.remove('chosen')
    document.querySelector('.live-chat').classList.remove('chosen')
    socket.send(JSON.stringify({
        type: 'logout'
    }))
    disconnectSocket()
    let res = await fetch('https://chatme-production-1e37.up.railway.app/api/users/remove', {
        method: 'GET',
        credentials: 'include'
    });
})

async function userExists() {
    let res = await fetch('https://chatme-production-1e37.up.railway.app/api/users/me', {
        method: 'GET',
        credentials: 'include'
    });
    if (res.ok) {
        let data = await res.json()
        socketConnection()
        document.querySelector('.profile-name').textContent = data.username;
        requestsArray = data.requests
        requests();
        friendsArray = data.friends
        friends();
        document.querySelector('.profile-pic3').style.background = data.color;
        document.querySelector('.profile-pic3').textContent = data.username.toUpperCase().slice(0, 1);
        document.querySelector('.signup').style.display = 'none'
        document.querySelector('.login').style.display = 'none'
        document.querySelector('.home').style.display = 'block'
    }
}
userExists();

document.querySelector('.chat-input').addEventListener('input', () => {
    if (document.querySelector('.chat-input').value.length == 0) {
        document.querySelector('.send').classList.remove('enabled')
        document.querySelector('.paper').classList.remove('enabled-color')
        document.querySelector('.chat-place').style.marginBottom = `0`
    } else {
        document.querySelector('.send').classList.add('enabled')
        document.querySelector('.paper').classList.add('enabled-color')
        document.querySelector('.chat-place').style.marginBottom = `30px`
    }
})

document.querySelectorAll('.exit').forEach(exit => {
    exit.addEventListener("click", () => {
    document.querySelector(".manage").classList.remove('appear')
    document.querySelector(".request-area").classList.remove('appear')
    document.querySelector(".response-area").classList.remove('appear')
    document.querySelector('.contact-inpt').value = '';
    
})
})
document.querySelector('.settings').addEventListener("click", () => {
    document.querySelector(".manage").classList.add('appear')
})
document.querySelector('.add-people').addEventListener("click", () => {
    document.querySelector(".request-area").classList.add('appear')
})
document.querySelector('.group').addEventListener("click", () => {
    document.querySelector(".response-area").classList.add('appear')
})
let cooldown3;
function requestMsg(msg, color) {
    clearTimeout(cooldown3);
    document.querySelector('.request-msg').textContent = msg
    document.querySelector('.request-msg').style.color = color
    document.querySelector('.request-msg').classList.add('throw2');
    cooldown3 = setTimeout(() => {
        document.querySelector('.request-msg').classList.remove('throw2')
    }, 5000)
}
document.querySelector('.send-request').addEventListener('click', async () => {
    let res = await fetch('https://chatme-production-1e37.up.railway.app/api/users/me', {
        method: 'GET',
        credentials: 'include'
    });
    let data = await res.json()
    let res2 = await fetch('https://chatme-production-1e37.up.railway.app/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: document.querySelector('.contact-inpt').value })
    });

    if (!res2.ok) {
        requestMsg('User does not exist!', 'rgb(248, 45, 45)');
        return;
    }
    if ((data.requests.every(one => one.to !== document.querySelector('.contact-inpt').value) || data.requests == 0) 
        && (data.friends.every(one => one.username !== document.querySelector('.contact-inpt').value) || data.friends == 0) 
        && document.querySelector('.contact-inpt').value !== data.username 
        && data.requests.every(one => one.from !== document.querySelector('.contact-inpt').value)) {
    let requestData = {
        type: 'contact-request',
        to: document.querySelector('.contact-inpt').value
    }
    document.querySelector('.contact-inpt').value = '';
    socket.send(JSON.stringify(requestData))
    requestMsg('Request was sent!', 'rgb(38, 240, 38)')
   } else if (document.querySelector('.contact-inpt').value == data.username) {
    requestMsg('Cannot self request!', 'rgb(248, 45, 45)')
   } else if ((data.requests.some(one => one.to == document.querySelector('.contact-inpt').value))) {
    requestMsg('Request was already sent!', 'rgb(248, 45, 45)')
   } else if (data.requests.some(one => one.from == document.querySelector('.contact-inpt').value)) {
    requestMsg('User already sent a request!', 'rgb(248, 45, 45)')
   } else if ((data.friends.some(one => one.username == document.querySelector('.contact-inpt').value) || data.friends !== 0)) {
    requestMsg('User was already added!', 'rgb(248, 45, 45)')
   }
});



function postCreation() {
    if (document.querySelector('.chat-input').value.trim() === '') return;
    document.querySelector('.send').classList.remove('enabled')
    document.querySelector('.paper').classList.remove('enabled-color')
    socket.send(JSON.stringify({
        type: 'direct-message',
        to: chosenFriend,
        text: chatInput.value
    }));
    chatInput.value = '';
    document.querySelector('.chat-place').style.marginBottom = `0`
}


postBtn.addEventListener('click', () => {
    postCreation();
})
function socketConnection() {
    if (socket && socket.readyState == WebSocket.OPEN) {
        return socket;
    }
    socket = new WebSocket('wss://chatme-production-1e37.up.railway.app');
socket.onopen = () => {
    console.log('connected!')
    socket.send(JSON.stringify({
    type: 'identity'
}));
}

socket.onmessage = async (e) => {
    let data = JSON.parse(e.data);
    if (data.type == 'contact-request') {
    requestsArray.push(data);
    requests();
    };
    if (data.type == 'response-to-request') {
        if (data.state == 'declined') {
            let index = requestsArray.findIndex(one => (one.from == data.to && one.to == data.from) || (one.from == data.from && one.to == data.to))
            requestsArray.splice(index, 1);
            requests()
        } if (data.state == 'accepted') {
            console.log(data)
            let index = requestsArray.findIndex(one => one.to == data.username || one.from == data.username)
            requestsArray.splice(index, 1);
            requests()
            friendsArray.push(data)
            friends();
        }
    };
    if (data.type == 'direct-message') {
        if (chosenFriend == data.from || chosenFriend == data.to) {
        messagesArray.push(data);
        sameUser = null
        messages();
        }
        document.querySelector('.live-chat').scrollBy({
            top: document.querySelector('.live-chat').scrollHeight,
            behavior: 'smooth'
        })
    } if (data.type == 'status') {
        if (data.state == 'offline') {
            state.push(data)
            friends(state);
        }
        if (data.state == 'online') {
            state.push(data)
            friends(state);
        }
    } if (data.type == 'end-friendship') {
        let user1 = friendsArray.findIndex(one => one.username == data.from)
        let user2 = friendsArray.findIndex(one => one.username == data.to)
        if (user1 !== -1) {
        friendsArray.splice(user1, 1)
        }
        if (user2 !== -1) {
        friendsArray.splice(user2, 1)
        }
        friends()
    }
}
socket.onerror = (err) => {
    console.log(err.message)
} 
socket.onclose = () => {
    console.log('disconnected!')
}
}
document.addEventListener('click', (e) => {
    if (!e.target.closest('.add-people') && !e.target.closest('.positioning3')) {
        document.querySelector('.request-area').classList.remove('appear')
        document.querySelector('.contact-inpt').value = '';
    }
    if (!e.target.closest('.group') && !e.target.closest('.positioning3')) {
        document.querySelector('.response-area').classList.remove('appear')
    }
    if (!e.target.closest('.settings') && !e.target.closest('.positioning3')) {
        document.querySelector('.manage').classList.remove('appear')
    }
    document.querySelectorAll('.edit-menu').forEach(menu => {
        if (!e.target.closest('.edit'))
                menu.classList.remove('toggle');
            })
})
document.querySelector('.user-home').append(document.querySelector('.chat-area'))
window.addEventListener('resize', () => {
    if (window.innerWidth > 800) {
        document.querySelector('.user-home').append(document.querySelector('.chat-area'))
        document.querySelector('.live-chat').scrollBy({
            top: document.querySelector('.live-chat').scrollHeight
        })
    } else {
        document.querySelector('.home').append(document.querySelector('.chat-area'))
         document.querySelector('.live-chat').scrollBy({
            top: document.querySelector('.live-chat').scrollHeight
        })
    }
})
document.querySelector('.go-back').addEventListener('click', () => {
    document.querySelector('.chat-area').classList.remove('msg');
})
function disconnectSocket() {
    if (socket) {
        socket.close()
        console.log('socket was disconnected!')
        socket = null
    }
}

const notif = document.querySelector('.notif');
const requestsArea = document.querySelector('.requests');
const notifcations = new MutationObserver(() => {
    if (requestsArea.children.length == 0) {
        notif.style.display = 'none'
    } else {
        notif.style.display = 'flex'
    }

    notif.textContent = requestsArea.children.length;
})

notifcations.observe(requestsArea, {
    subtree: false,
    childList: true,
    characterData: true
})

chatInput.addEventListener('touchstart', (e) => {
   e.preventDefault()
   chatInput.focus()
}, { passive: false })
