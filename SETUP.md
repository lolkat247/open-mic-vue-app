# Open Mic Queue Manager - Setup Guide

## ✅ Configuration Complete!

The application is now configured with your deployed AWS backend:

- **API URL**: `https://ron7jxwp78.execute-api.us-east-1.amazonaws.com/prod/`
- **WebSocket URL**: `wss://bfynx6i5u2.execute-api.us-east-1.amazonaws.com/prod`
- **User Pool ID**: `us-east-1_wQnSJZ3oF`
- **Client ID**: `7q4qj1a1t3ll33a7ormd1j7i2k`
- **Region**: `us-east-1`

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### 3. Test the Application

#### Option A: Create a Test Event (Requires Admin Access)
You'll need to implement the admin dashboard first (see IMPLEMENTATION_COMPLETE.md)

#### Option B: Use an Existing Event
If you have an event ID from the backend, you can test:

**Public Queue View:**
```
http://localhost:5173/event/{eventId}/queue
```

**Performer Signup:**
```
http://localhost:5173/event/{eventId}/signup
```

**Projector View:**
```
http://localhost:5173/event/{eventId}/projector
```

---

## 🔧 Configuration Options

### Using Environment Variables (Optional)

If you want to override the default configuration, create a `.env` file:

```bash
cp .env.example .env
```

Then edit `.env` with your values. Environment variables take precedence over the defaults in `src/config.ts`.

### Custom Domain Setup

Your backend has custom domains configured:
- API: `api.openmic.site`
- WebSocket: `ws.openmic.site`

Once DNS is configured, you can update the URLs to use these domains instead of the CloudFront URLs.

---

## 📋 Available Features

### ✅ Currently Working
- **Home Page**: Navigation and event ID entry
- **Public Queue View**: Real-time queue display with WebSocket
- **Performer Signup**: Full signup form with validation
- **Projector View**: Full-screen display optimized for large screens

### ⏳ To Be Implemented
- **Admin Login**: Cognito authentication
- **Admin Dashboard**: Event management
- **Manage Slot**: Edit/withdraw performer slots

See `IMPLEMENTATION_COMPLETE.md` for full details.

---

## 🧪 Testing Checklist

### Test Public Queue View
1. Navigate to `/event/{eventId}/queue`
2. Verify WebSocket connection (check browser console)
3. Verify event info displays
4. Check that queue updates in real-time

### Test Performer Signup
1. Navigate to `/event/{eventId}/signup`
2. Fill out the signup form
3. Verify validation works
4. Submit and check success dialog
5. Verify slot appears in queue

### Test Projector View
1. Navigate to `/event/{eventId}/projector`
2. Verify fullscreen activation
3. Check large typography is readable
4. Verify real-time updates
5. Test on a large display if possible

---

## 🐛 Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
- Check that the API Gateway has CORS enabled
- Verify the origin is allowed in the backend configuration

### WebSocket Connection Failed
If WebSocket won't connect:
- Check the WebSocket URL in config
- Verify the WebSocket API is deployed
- Check browser console for specific error messages

### Authentication Issues
If Cognito authentication fails:
- Verify User Pool ID and Client ID are correct
- Check that the User Pool is in the correct region
- Ensure the app client has the correct settings

### Event Not Found
If an event doesn't load:
- Verify the event ID exists in the backend
- Check the API URL is correct
- Look for API errors in Network tab

---

## 📚 Next Steps

1. **Test with Real Data**: Create events using the backend API directly
2. **Build Admin Features**: Implement admin dashboard (see remaining work in IMPLEMENTATION_COMPLETE.md)
3. **Add CAPTCHA**: Integrate CAPTCHA for signup form
4. **Deploy**: Build for production and deploy to your hosting service

---

## 🏗️ Build for Production

```bash
# Build the app
npm run build

# Preview the production build locally
npm run preview
```

The built files will be in the `dist/` directory, ready to deploy to any static hosting service (Netlify, Vercel, S3 + CloudFront, etc.).

---

## 📖 Documentation

- **API Documentation**: `../../open-mic-backend-api/FRONTEND_API_DOCUMENTATION.md`
- **Implementation Status**: `IMPLEMENTATION_COMPLETE.md`
- **Development Status**: `DEVELOPMENT_STATUS.md`

---

## 🎉 You're All Set!

The app is configured and ready to use. Start the dev server and begin testing!

```bash
npm run dev
```

Happy coding! 🎸🎤