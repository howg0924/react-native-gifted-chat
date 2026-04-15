import React from 'react';

const GiftedChatContext = React.createContext({
  actionSheet: () => null,
  getLocale: () => 'en',
});

export default GiftedChatContext;
