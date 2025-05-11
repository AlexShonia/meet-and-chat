# Meet and Chat
Site live now on: https://meet-and-chat.ashonia.info/

A modern, real-time chat application that allows users to connect with others through text and image sharing. Built with Django and WebSocket technology, Meet and Chat provides a seamless and engaging user experience.

## 🌟 Features

### Chat Features
- Real-time one-on-one chat functionality
- Image sharing capability
- System notifications for user join/leave events
- Sound notifications for new matches
- Message timestamps
- Auto-scrolling chat window

### User Interface
- Clean, minimalist design with dark/light theme support
- Responsive layout that works across different devices
- Custom scrollbars and smooth animations
- Roboto Mono font for enhanced readability

### User Experience
- Guest login system with username selection
- Easy navigation between chat rooms
- "Next Person" feature to find new chat partners
- Theme persistence across sessions
- File upload support for images

### Security
- CSRF protection
- WebSocket secure connections
- Input validation and sanitization

## 🛠️ Technical Stack

- **Backend**: Django
- **Real-time Communication**: WebSocket
- **Frontend**: HTML5, CSS3, JavaScript
- **Styling**: Custom CSS with CSS variables
- **Icons**: SVG icons for better scaling
- **Font**: Google Fonts (Roboto Mono)


## 🔄 User Flow

1. **Entry Point**
   - Users land on the welcome page
   - Option to join as a guest with a username
   - Google login option (currently disabled)

2. **Chat Selection**
   - Choose between different chat types:
     - One-on-One Chat (Active)
     - Group Chat (Coming Soon)
     - Voice Chat (Coming Soon)

3. **Chat Room**
   - Real-time messaging
   - Image sharing
   - User status updates
   - Option to find new chat partners
   - Easy navigation back to previous screens

## 🚀 Future Enhancements

- Group chat functionality
- Voice chat integration
- Google authentication
- Message history
- User profiles
- Emoji support
- Message reactions

## 📝 Notes

- The application uses WebSocket for real-time communication
- Theme preferences are stored in the browser's localStorage
- Image uploads are supported with preview functionality
- The UI is designed to be intuitive and user-friendly
