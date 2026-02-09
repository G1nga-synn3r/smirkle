/**
 * Message Service - Firestore Messaging Operations
 * 
 * Provides real-time messaging functionality using Firestore sub-collections.
 * Messages are stored in both sender's sent folder and receiver's inbox.
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  limit,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, writeBatch as exportWriteBatch } from './firebaseConfig.js';

/**
 * Send a message to another user
 * 
 * @param {Object} messageData - Message details
 * @param {string} messageData.senderId - Current user's ID
 * @param {string} messageData.receiverId - Recipient user's ID
 * @param {string} messageData.text - Message content
 * @returns {Promise<string>} The ID of the created message document
 */
export async function sendMessage({ senderId, receiverId, text }) {
  // Limit message length
  const maxLength = 500;
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;
  
  const messageData = {
    sender_id: senderId,
    receiver_id: receiverId,
    text: truncatedText,
    is_read: false,
    created_at: serverTimestamp()
  };
  
  // Add to sender's sent sub-collection
  const sentRef = collection(db, 'users', senderId, 'sent');
  const sentDoc = await addDoc(sentRef, messageData);
  
  // Add to receiver's inbox sub-collection
  const inboxRef = collection(db, 'users', receiverId, 'inbox');
  await addDoc(inboxRef, {
    ...messageData,
    parent_message_id: sentDoc.id
  });
  
  return sentDoc.id;
}

/**
 * Get real-time updates for incoming messages (inbox)
 * Uses Firestore's onSnapshot for live synchronization
 * 
 * @param {string} userId - The current user's ID
 * @param {Function} callback - Callback function to handle incoming messages
 * @returns {Function} Unsubscribe function to stop listening
 */
export function getRealTimeMessages(userId, callback) {
  const inboxRef = collection(db, 'users', userId, 'inbox');
  
  // Query for messages ordered by creation time, newest first
  const q = query(
    inboxRef,
    orderBy('created_at', 'desc'),
    limit(50)
  );
  
  // Set up real-time listener
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(messages);
  }, (error) => {
    console.error('Error listening to messages:', error);
  });
  
  return unsubscribe;
}

/**
 * Get real-time updates for sent messages
 * 
 * @param {string} userId - The current user's ID
 * @param {Function} callback - Callback function to handle sent messages
 * @returns {Function} Unsubscribe function to stop listening
 */
export function getRealTimeSentMessages(userId, callback) {
  const sentRef = collection(db, 'users', userId, 'sent');
  
  const q = query(
    sentRef,
    orderBy('created_at', 'desc'),
    limit(50)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(messages);
  }, (error) => {
    console.error('Error listening to sent messages:', error);
  });
  
  return unsubscribe;
}

/**
 * Mark a message as read when user views it
 * 
 * @param {string} userId - The current user's ID (receiver)
 * @param {string} messageId - The message ID to mark as read
 * @returns {Promise<void>}
 */
export async function markMessageAsRead(userId, messageId) {
  const messageRef = doc(db, 'users', userId, 'inbox', messageId);
  
  await updateDoc(messageRef, {
    is_read: true
  });
}

/**
 * Mark all messages from a specific sender as read
 * 
 * @param {string} userId - The current user's ID
 * @param {string} senderId - The sender's user ID
 * @returns {Promise<void>}
 */
export async function markAllMessagesFromSenderAsRead(userId, senderId) {
  const inboxRef = collection(db, 'users', userId, 'inbox');
  const q = query(
    inboxRef,
    where('sender_id', '==', senderId),
    where('is_read', '==', false)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return;
  }
  
  // Use batch write for efficient atomic update
  const batch = writeBatch(db);
  snapshot.forEach((docSnapshot) => {
    batch.update(docSnapshot.ref, { is_read: true });
  });
  await batch.commit();
}

/**
 * Get unread message count for a user
 * 
 * @param {string} userId - The current user's ID
 * @returns {Promise<number>} Number of unread messages
 */
export async function getUnreadCount(userId) {
  const inboxRef = collection(db, 'users', userId, 'inbox');
  const q = query(
    inboxRef,
    where('is_read', '==', false)
  );
  
  const snapshot = await import('firebase/firestore').then(({ getDocs }) => getDocs(q));
  return snapshot.size;
}

/**
 * Delete a message from inbox (receiver side)
 * 
 * @param {string} userId - The current user's ID
 * @param {string} messageId - The message ID to delete
 * @returns {Promise<void>}
 */
export async function deleteMessage(userId, messageId) {
  const { deleteDoc } = await import('firebase/firestore');
  const messageRef = doc(db, 'users', userId, 'inbox', messageId);
  await deleteDoc(messageRef);
}

export default {
  sendMessage,
  getRealTimeMessages,
  getRealTimeSentMessages,
  markMessageAsRead,
  markAllMessagesFromSenderAsRead,
  getUnreadCount,
  deleteMessage
};
