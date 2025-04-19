import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

function LiveChat() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const stompClientRef = useRef(null);
  const conversationRef = useRef(null);

  useEffect(() => {
    stompClientRef.current = new Client({
      brokerURL: 'ws://localhost:8080/livechat-websocket',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClientRef.current.onConnect = (frame) => {
      setConnected(true);
      console.log('Connected: ' + frame);
      stompClientRef.current.subscribe('/topics/livechat', (message) => {
        const newMessage = JSON.parse(message.body).content;
        setMessages(prev => [...prev, newMessage]);
      });
    };

    stompClientRef.current.onWebSocketError = (error) => {
      console.error('Error with websocket', error);
    };

    stompClientRef.current.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    return () => {
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.deactivate();
      }
    };
  }, []);

  useEffect(() => {
    // Rolagem automática para a última mensagem
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages]);

  const connect = () => {
    if (stompClientRef.current) {
      stompClientRef.current.activate();
    }
  };

  const disconnect = () => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      setConnected(false);
      console.log("Disconnected");
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: "/app/new-message",
        body: JSON.stringify({ user: username, message: messageInput })
      });
      setMessageInput('');
    }
  };

  return (
    <div className="container">
      <div id="main-content">
        <div className="row">
          <h2>LiveChat</h2>
        </div>

        <div className="row">
          <div className="button-group">
            <button
              id="connect"
              className="btn btn-connect"
              onClick={connect}
              disabled={connected}
            >
              Connect
            </button>
            <button
              id="disconnect"
              className="btn btn-disconnect"
              onClick={disconnect}
              disabled={!connected}
            >
              Disconnect
            </button>
          </div>
          
          <form className="form-inline">
            <div className="form-group">
              <label htmlFor="user">Username:</label>
              <input
                type="text"
                id="user"
                className="form-control"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div className="message-input-container">
              <div className="form-group message-input-field">
                <label htmlFor="message">Message:</label>
                <input
                  type="text"
                  id="message"
                  className="form-control"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
              </div>
              
              <button 
                id="send" 
                onClick={sendMessage} 
                className="btn btn-primary send-button" 
                type="submit"
                disabled={!connected}
              >
                Send
              </button>
            </div>
          </form>
        </div>

        <div className="row">
          <table 
            id="conversation" 
            className={`${connected ? 'show' : ''}`}
            style={{ display: connected ? 'table' : 'none' }}
            ref={conversationRef}
          >
            <thead>
              <tr>
                <th>Live Chat</th>
              </tr>
            </thead>
            <tbody id="livechat">
              {messages.map((msg, index) => (
                <tr key={index}>
                  <td>{msg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LiveChat;