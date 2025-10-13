import BoringAvatar from "boring-avatars";
import { round } from "lodash";
import { DateTime } from "luxon";
import mapboxgl from "mapbox-gl";
import { createElement, useEffect, useRef } from "react";
// @ts-ignore - React 19 has built-in types
import { renderToStaticMarkup } from "react-dom/server";
import * as CountryFlags from "country-flag-icons/react/3x2";
import {
  Monitor,
  Smartphone,
  Link,
  Eye,
  MousePointerClick,
  Search,
  ExternalLink,
  Users,
  Mail,
  HelpCircle,
  DollarSign,
  Video,
  Handshake,
  FileText,
  ShoppingCart,
  Calendar,
  Headphones,
} from "lucide-react";
import { useTimelineSessions } from "./useTimelineSessions";
import { generateName } from "../../../../components/Avatar";
import { formatShortDuration, hour12, userLocale } from "../../../../lib/dateTimeUtils";

// Generate avatar SVG using boring-avatars
function generateAvatarSVG(userId: string, size: number): string {
  const avatarElement = createElement(BoringAvatar, {
    size,
    name: userId,
    variant: "beam",
    colors: ["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"],
  });
  return renderToStaticMarkup(avatarElement);
}

// Render country flag to static SVG
function renderCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const FlagComponent = CountryFlags[countryCode.toUpperCase() as keyof typeof CountryFlags];
  if (!FlagComponent) return "";
  const flagElement = createElement(FlagComponent, { className: "w-4 h-3 inline-block" });
  return renderToStaticMarkup(flagElement);
}

// Render device icon based on device type
function renderDeviceIcon(deviceType: string): string {
  const type = deviceType?.toLowerCase() || "";
  const Icon = type.includes("mobile") || type.includes("tablet") ? Smartphone : Monitor;
  const iconElement = createElement(Icon, { size: 14, className: "inline-block" });
  return renderToStaticMarkup(iconElement);
}

// Render referrer icon
function renderReferrerIcon(): string {
  const iconElement = createElement(Link, { size: 14, className: "inline-block" });
  return renderToStaticMarkup(iconElement);
}

// Get browser icon path
function getBrowserIconPath(browser: string): string {
  const BROWSER_TO_LOGO: Record<string, string> = {
    Chrome: "Chrome.svg",
    "Mobile Chrome": "Chrome.svg",
    Firefox: "Firefox.svg",
    "Mobile Firefox": "Firefox.svg",
    Safari: "Safari.svg",
    "Mobile Safari": "Safari.svg",
    Edge: "Edge.svg",
    Opera: "Opera.svg",
    Brave: "Brave.svg",
  };
  return BROWSER_TO_LOGO[browser] ? `/browsers/${BROWSER_TO_LOGO[browser]}` : "";
}

// Get OS icon path
function getOSIconPath(os: string): string {
  const OS_TO_LOGO: Record<string, string> = {
    Windows: "Windows.svg",
    Android: "Android.svg",
    android: "Android.svg",
    Linux: "Tux.svg",
    macOS: "macOS.svg",
    iOS: "Apple.svg",
    "Chrome OS": "Chrome.svg",
  };
  return OS_TO_LOGO[os] ? `/operating-systems/${OS_TO_LOGO[os]}` : "";
}

// Get channel icon based on channel type
function getChannelIcon(channel: string): string {
  let Icon;
  switch (channel) {
    case "Direct":
      Icon = Link;
      break;
    case "Organic Search":
    case "Paid Search":
      Icon = Search;
      break;
    case "Referral":
      Icon = ExternalLink;
      break;
    case "Organic Social":
    case "Paid Social":
      Icon = Users;
      break;
    case "Email":
      Icon = Mail;
      break;
    case "Organic Video":
      Icon = Video;
      break;
    case "Affiliate":
      Icon = Handshake;
      break;
    case "Content":
      Icon = FileText;
      break;
    case "Organic Shopping":
      Icon = ShoppingCart;
      break;
    case "Event":
      Icon = Calendar;
      break;
    case "Audio":
      Icon = Headphones;
      break;
    case "Display":
    case "Paid Unknown":
      Icon = DollarSign;
      break;
    case "Unknown":
    default:
      Icon = HelpCircle;
      break;
  }
  const iconElement = createElement(Icon, { size: 14, className: "inline-block" });
  return renderToStaticMarkup(iconElement);
}

// Extract domain from referrer URL
function extractDomain(url: string): string | null {
  try {
    if (!url || url === "direct") return null;
    if (url.startsWith("android-app://")) {
      const match = url.match(/android-app:\/\/([^/]+)/);
      return match ? match[1] : null;
    }
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

// Get display name for domain
function getDisplayName(hostname: string): string {
  if (hostname.startsWith("google.") || hostname.startsWith("www.google.")) return "Google";
  if (hostname === "accounts.google.com") return "Google";
  if (hostname === "mail.google.com") return "Gmail";

  const commonSites: Record<string, string> = {
    "bing.com": "Bing",
    "facebook.com": "Facebook",
    "www.facebook.com": "Facebook",
    "instagram.com": "Instagram",
    "youtube.com": "YouTube",
    "reddit.com": "Reddit",
    "twitter.com": "Twitter",
    "x.com": "X",
    "t.co": "X",
    "linkedin.com": "LinkedIn",
    "github.com": "GitHub",
    "tiktok.com": "TikTok",
  };

  return commonSites[hostname] || hostname;
}

export function useTimelineLayer({
  map,
  mapLoaded,
  mapView,
}: {
  map: React.RefObject<mapboxgl.Map | null>;
  mapLoaded: boolean;
  mapView: string;
}) {
  const { activeSessions } = useTimelineSessions();
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const markersMapRef = useRef<Map<string, { marker: mapboxgl.Marker; element: HTMLDivElement }>>(new Map());

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Initialize popup once
    if (!popupRef.current) {
      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "globe-tooltip",
      });
    }

    const markersMap = markersMapRef.current;

    // Hide all markers if not in timeline view
    if (mapView !== "timeline") {
      markersMap.forEach(({ marker }) => marker.remove());
      return;
    }

    // Build set of active session IDs
    const activeSessionIds = new Set(activeSessions.filter(s => s.lat && s.lon).map(s => s.session_id));

    // Remove markers for sessions that are no longer active
    const toRemove: string[] = [];
    markersMap.forEach(({ marker }, sessionId) => {
      if (!activeSessionIds.has(sessionId)) {
        marker.remove();
        toRemove.push(sessionId);
      }
    });
    toRemove.forEach(id => markersMap.delete(id));

    // Create or update markers for active sessions
    activeSessions
      .filter(session => session.lat && session.lon)
      .forEach(session => {
        if (!map.current) return;

        const roundedLat = round(session.lat, 4);
        const roundedLon = round(session.lon, 4);
        const existing = markersMap.get(session.session_id);

        if (existing) {
          // Update existing marker position if needed
          const currentLngLat = existing.marker.getLngLat();
          if (currentLngLat.lng !== roundedLon || currentLngLat.lat !== roundedLat) {
            existing.marker.setLngLat([roundedLon, roundedLat]);
          }
          // Re-add marker if it was removed
          if (!existing.marker.getElement().isConnected) {
            existing.marker.addTo(map.current);
          }
        } else {
          // Create new marker
          const avatarContainer = document.createElement("div");
          avatarContainer.className = "timeline-avatar-marker";
          avatarContainer.style.cursor = "pointer";
          avatarContainer.style.borderRadius = "50%";
          avatarContainer.style.overflow = "hidden";
          avatarContainer.style.width = "32px";
          avatarContainer.style.height = "32px";
          avatarContainer.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";

          // Generate avatar SVG
          const avatarSVG = generateAvatarSVG(session.user_id, 32);
          avatarContainer.innerHTML = avatarSVG;

          // Create marker
          const marker = new mapboxgl.Marker({
            element: avatarContainer,
            anchor: "center",
          })
            .setLngLat([roundedLon, roundedLat])
            .addTo(map.current);

          // Add hover events for tooltip
          const showTooltip = () => {
            if (!map.current || !popupRef.current) return;

            const avatarSVG = generateAvatarSVG(session.user_id, 36);
            const countryCode = session.country?.length === 2 ? session.country : "";
            const flagSVG = renderCountryFlag(countryCode);
            const deviceIconSVG = renderDeviceIcon(session.device_type || "");
            const browserIconPath = getBrowserIconPath(session.browser || "");
            const osIconPath = getOSIconPath(session.operating_system || "");

            // Duration formatting
            const durationDisplay = formatShortDuration(session.session_duration || 0);

            // Start time formatting
            const startTime = DateTime.fromSQL(session.session_start, { zone: "utc" })
              .setLocale(userLocale)
              .toLocal()
              .toFormat(hour12 ? "MMM d, h:mm a" : "dd MMM, HH:mm");

            // Pageview and event icons
            const pageviewIconSVG = renderToStaticMarkup(
              createElement(Eye, { size: 14, className: "inline-block text-blue-400" })
            );
            const eventIconSVG = renderToStaticMarkup(
              createElement(MousePointerClick, { size: 14, className: "inline-block text-amber-400" })
            );

            const name = generateName(session.user_id);

            const html = `
              <div class="flex flex-col gap-3 p-1">
                <div class="flex items-start gap-2.5">
                  <div class="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden">
                    ${avatarSVG}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-semibold text-white truncate">${name}</h3>
                    <div class="flex items-center gap-1 text-xs text-neutral-300 mt-0.5">
                      ${flagSVG}
                      <span>${session.city || "Unknown"}, ${session.country || "Unknown"}</span>
                    </div>
                  </div>
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                  ${browserIconPath ? `<img src="${browserIconPath}" alt="${session.browser}" title="${session.browser}" class="w-4 h-4" />` : ""}
                  ${osIconPath ? `<img src="${osIconPath}" alt="${session.operating_system}" title="${session.operating_system}" class="w-4 h-4" />` : ""}
                  <span class="flex items-center" title="${session.device_type}">${deviceIconSVG}</span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-xs">
                    ${pageviewIconSVG}
                    <span>${session.pageviews || 0}</span>
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-xs">
                    ${eventIconSVG}
                    <span>${session.events || 0}</span>
                  </span>
                </div>
                <div class="flex items-center gap-2 text-xs text-neutral-400 pt-1.5 border-t border-neutral-700">
                  <span>${startTime}</span>
                  <span class="text-neutral-500">•</span>
                  <span>${durationDisplay}</span>
                </div>
              </div>
            `;

            popupRef.current.setLngLat([roundedLon, roundedLat]).setHTML(html).addTo(map.current);
          };

          const hideTooltip = () => {
            if (popupRef.current) {
              popupRef.current.remove();
            }
          };

          avatarContainer.addEventListener("mouseenter", showTooltip);
          avatarContainer.addEventListener("mouseleave", hideTooltip);

          // Store marker
          markersMap.set(session.session_id, { marker, element: avatarContainer });
        }
      });

    // Cleanup function
    return () => {
      if (mapView !== "timeline") {
        markersMap.forEach(({ marker }) => marker.remove());
      }
    };
  }, [activeSessions, mapLoaded, map, mapView]);
}
