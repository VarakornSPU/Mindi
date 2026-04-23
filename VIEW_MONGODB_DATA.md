# 🔍 How to View Your Data in MongoDB Atlas

Now that you have data in MongoDB, here's how to view it directly in the MongoDB Atlas dashboard.

## Step 1: Go to MongoDB Atlas

1. Open your browser and go to: https://account.mongodb.com/account/login
2. Login with your MongoDB credentials (Mindi / Mindi123)

## Step 2: Access Your Cluster

1. On the dashboard, click your cluster: **cluster0**
2. Click the **Browse Collections** button

## Step 3: View the Data

### Users Collection
```
Database: mindi_db
Collection: Users
```

You should see 2 documents:
- Document 1: Alice Smith (alice@example.com)
- Document 2: Bob Johnson (bob@example.com)

Each document contains:
- `_id` - Unique identifier
- `username` - User's username
- `email` - User's email
- `password_hash` - Hashed password
- `full_name` - User's full name
- `createdAt` - When the account was created
- `preferences` - User preferences (language, theme, notifications)
- `is_active` - Account status

### History Collection
```
Database: mindi_db
Collection: History
```

You should see 2 documents (chat messages):
- Document 1: Alice's message ("Hello Mindi, I need some advice")
- Document 2: Mindi's response ("Hi Alice! I am Mindi...")

Each document contains:
- `_id` - Unique message ID
- `userId` - Which user sent/received this
- `sessionId` - Which conversation session
- `role` - "user" or "bot"
- `content` - The message text
- `message_type` - "text", "image", or "document"
- `timestamp` - When the message was created
- `createdAt` - Document creation time
- `metadata` - Additional info (sources, confidence, model_version)

## Step 4: Query the Data (Optional)

In MongoDB Atlas, you can run queries using the **Aggregation** tab:

### Find all users
```javascript
db.Users.find({})
```

### Find a specific user by email
```javascript
db.Users.find({ email: "alice@example.com" })
```

### Get chat history for a user
```javascript
db.History.find({ userId: "69e9fe8a2955bd6254849e66" })
```

### Get messages from a specific session
```javascript
db.History.find({ 
  userId: "69e9fe8a2955bd6254849e66",
  sessionId: "session_001"
})
```

### Count total users
```javascript
db.Users.countDocuments({})
```

### Count total messages
```javascript
db.History.countDocuments({})
```

## Step 5: Monitor Usage

In MongoDB Atlas, you can see:
- **Storage size** - How much data you're using
- **Operations** - Read/write operations count
- **Active connections** - How many connections to the database
- **Network traffic** - Data in/out

Free tier (M0) gives you:
- 512 MB storage
- Unlimited operations
- Shared resources

---

## 💡 Pro Tips

1. **View in JSON format** - Click the `JSON` view option in Atlas
2. **Export data** - Use the export button to download data as CSV/JSON
3. **Create backups** - MongoDB Atlas automatically backs up your data daily
4. **Monitor logs** - Check the Logs section for any errors
5. **View indexes** - Go to Indexes tab to see your created indexes

---

## 🔗 Quick Links

- **MongoDB Atlas Dashboard:** https://cloud.mongodb.com
- **Database Name:** `mindi_db`
- **Collections:**
  - `Users` - User accounts
  - `History` - Chat messages

---

## 📞 Troubleshooting

**Can't see the collections?**
- Click the "Refresh" button
- Make sure you're in the correct database (`mindi_db`)
- Check that your cluster is running

**No data showing?**
- Make sure the backend server is running
- Check that your `.env` file has the correct MongoDB URI
- Try registering a new user again

**Want to delete a collection?**
- Right-click on the collection name
- Select "Drop Collection"
- Confirm the deletion

---

**Your MongoDB Atlas is now ready to track all Mindi users and conversations!** 🎉
