import * as L from 'leaflet';

// Helper function to create custom div icon
const createCustomIcon = (html: string, className: string) => {
  return L.divIcon({
    html,
    className,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Mystery Box Icon (Purple/Orange gradient)
export const mysteryBoxIcon = createCustomIcon(
  `<div class="custom-marker mystery-box">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <path d="m3.3 7 8.7 5 8.7-5"/>
      <path d="M12 22V12"/>
    </svg>
  </div>`,
  'custom-marker-wrapper'
);

// Single Item Icon (Green)
export const singleItemIcon = createCustomIcon(
  `<div class="custom-marker single-item">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
      <path d="M12 18V6"/>
    </svg>
  </div>`,
  'custom-marker-wrapper'
);

// Urgent Icon (Red - for items expiring soon)
export const urgentIcon = createCustomIcon(
  `<div class="custom-marker urgent">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <path d="M12 9v4"/>
      <path d="M12 17h.01"/>
    </svg>
  </div>`,
  'custom-marker-wrapper'
);

// User Location Icon (Blue)
export const userLocationIcon = createCustomIcon(
  `<div class="custom-marker user-location">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  </div>`,
  'custom-marker-wrapper'
);

// Function to get appropriate icon based on post data
export const getMarkerIcon = (post: any) => {
  const now = new Date();
  const expiryDate = new Date(post.expiryDate);
  const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Urgent if expiring in less than 2 hours
  if (hoursUntilExpiry < 2 && hoursUntilExpiry > 0) {
    return urgentIcon;
  }

  // Otherwise use type-based icon
  return post.type === 'MYSTERY_BOX' ? mysteryBoxIcon : singleItemIcon;
};

// Custom cluster icon
export const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  let size = 'small';
  let className = 'marker-cluster-small';

  if (count > 10) {
    size = 'medium';
    className = 'marker-cluster-medium';
  }
  if (count > 50) {
    size = 'large';
    className = 'marker-cluster-large';
  }

  return L.divIcon({
    html: `<div class="cluster-inner"><span>${count}</span></div>`,
    className: `marker-cluster ${className}`,
    iconSize: [40, 40],
  });
};
