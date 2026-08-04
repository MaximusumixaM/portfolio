import { useEffect, useRef, useState } from "react";

import { Helper } from "@/components/peduncle/Typography";

/** Fixed logical play area (3:4). The canvas scales to fit; physics stays resolution-independent. */
const LOGICAL_W = 360;
const LOGICAL_H = 480;

/** Drag distance (logical px) for a full-power shot, and the resulting launch speed (px/s). */
const MAX_DRAG = 210;
const MAX_SPEED = 640;
/** Ignore micro-drags so a tap doesn't fire a stray shot. */
const MIN_DRAG = 10;

// Center-ice logo SVG (needs its xmlns to render as an image); drawn on the ice ~90px tall. Empty = no logo.
const CENTER_LOGO_SVG: string = `<svg width="189" height="185" viewBox="0 0 189 185" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M109.688 138.27C136.912 138.27 159.133 127.846 159.133 127.846L171.031 154.448C171.031 154.448 145.583 173.957 103.523 173.957C21.295 173.957 11.977 108.948 11.977 108.948C11.977 108.948 21.034 77.645 51.715 60.723L52.015 61.794L55.65 62.205C44.056 67.566 25.82 80.274 14.977 109.25C14.977 109.25 24.958 171.039 103.523 171.039C141.959 171.039 167.365 153.437 167.365 153.437L157.664 131.734C157.664 131.734 136.759 141.183 109.687 141.183C72.228 141.183 61.624 118.794 59.416 107.934L59.41 107.907C59.07 106.181 58.916 104.735 58.916 103.735C58.916 96.751 60.273 93.158 60.273 93.158L42.304 100.392L44.864 103.026C44.864 103.026 42.164 103.809 33.247 107.84L39.423 96.68L34.74 96.315L52.075 82.977L46.052 80.921L56.708 79.152L54.573 73.851L60.539 76.958L65.126 62.628L69.296 58.442L71.51 56.234L69.339 54.767C76.589 51.975 83.241 49.286 84.141 48.169C87.761 44.238 89.233 21.59 89.233 13.812C89.233 13.812 93.958 13.056 97.613 13.056C101.428 13.056 109.057 13.056 111.646 20.672C114.894 31.218 117.108 39.878 118.834 43.5C123.157 52.518 162.23 56.008 169.302 75.15C172.702 77.599 179.096 81.887 179.096 86.194C179.096 90.772 176.924 92.8 176.924 92.8L165.085 106.135C165.085 106.135 157.631 98.233 131.77 90.937L93.594 109.999C86.217 111.984 63.116 110.594 63.116 110.594C63.116 110.594 69.13 138.27 109.688 138.27ZM43.207 114.687L39.983 127.003L47.292 123.569L51.16 137.319L59.371 137.21L59.549 146.196C59.549 146.196 73.114 154.66 93.93 156.863C121.178 159.767 151.158 148.012 151.158 148.012C151.158 148.012 126.015 157.589 97.932 155.08C76.676 153.178 64.123 144.476 64.123 144.476L61.909 134.52L55.241 135.383L49.661 121.198L43.855 122.924L46.647 113.253L33.101 110.741L39.769 106.375L47.5 103.584L46.214 100.786L56.124 97.493C55.915 99.198 55.75 101.273 55.75 103.734C55.75 114.838 66.583 144.357 109.686 144.357C131.53 144.357 149.248 138.433 156.034 135.804L163.363 152.197C156.502 156.246 134.13 167.86 103.521 167.86C32.591 167.86 19.736 116.902 18.245 109.548C30.546 77.444 51.77 66.552 61.649 63.108L58.379 73.326L50.166 68.651L54.803 78.003L41.483 80.572L49.658 83.803L30.888 97.78L35.37 97.661L32.03 104.364L29.17 112.965L43.207 114.687ZM48.496 43.426L68.28 57.104L64.216 62.567L54.168 60.089L48.496 43.426ZM94.956 113.673L132.185 95.108C157.654 102.256 165.209 111.924 165.209 111.924L179.796 95.423C180.594 94.582 182.998 91.608 182.998 86.196C182.998 80.329 176.88 75.8 172.599 72.72C165.347 53.666 125.181 48.156 122.214 41.523C121.195 39.239 115.327 19.42 115.327 19.42C111.836 9.16297 101.503 9.16296 97.617 9.16296C93.71 9.16296 85.335 10.476 85.335 10.476C85.335 24.77 83.397 42.202 81.378 45.374C81.378 45.374 74.131 49.184 65.606 52.246L45.293 38.546L50.632 56.992C16.356 75.834 7.99902 108.66 7.99902 108.66C7.99902 108.66 16.814 177.835 103.524 177.835C149.365 177.835 175.829 155.673 175.829 155.673L161.063 122.646C161.063 122.646 138.509 134.372 109.689 134.372C83.107 134.372 72.717 121.983 68.922 114.779C91.42 115.442 94.956 113.673 94.956 113.673Z" fill="#989A9D"/><path d="M75.2972 76.314L82.7102 80.635L70.0702 79.11L75.2972 76.314ZM76.5132 74.187L66.7752 79.622L86.1432 82.237L76.5132 74.187Z" fill="#B0B0B3"/><path d="M62.4172 88.282L48.6352 90.426L63.8592 80.11L62.4172 88.282ZM63.9512 89.415L65.6542 77.406L43.1592 92.541L63.9512 89.415Z" fill="#B0B0B3"/><path d="M69.0962 65.787L79.3952 59.981L70.5212 72.005L69.0962 65.787ZM82.9062 56.131L66.6462 65.226L70.8752 75.333L82.9062 56.131Z" fill="#B0B0B3"/><path d="M62.4171 88.28L63.8601 80.107L48.6341 90.424L62.4171 88.28Z" fill="#1F427C"/><path d="M70.0691 79.111L82.7101 80.636L75.2961 76.314L70.0691 79.111Z" fill="#1F427C"/><path d="M79.3941 59.981L69.0971 65.787L70.5201 72.006L79.3941 59.981Z" fill="#1F427C"/><path d="M156.036 135.807C149.25 138.436 131.53 144.36 109.688 144.36C66.5871 144.36 55.7521 114.842 55.7521 103.738C55.7521 101.277 55.9171 99.202 56.1241 97.497L46.2151 100.789L47.5011 103.588L39.7691 106.379L33.1041 110.745L46.6461 113.257L43.8541 122.928L49.6601 121.202L55.2401 135.387L61.9081 134.524L64.1221 144.481C64.1221 144.481 76.6741 153.182 97.9311 155.085C126.014 157.594 151.157 148.017 151.157 148.017C151.157 148.017 121.176 159.772 93.9281 156.868C73.1131 154.665 59.5471 146.205 59.5471 146.205L59.3691 137.216L51.1581 137.324L47.2901 123.574L39.9801 127.008L43.2051 114.692L29.1711 112.969L32.0351 104.372L35.3711 97.668L30.8891 97.784L49.6591 83.811L41.4841 80.58L54.8081 78.015L50.1711 68.66L58.3811 73.335L61.6511 63.12C51.7721 66.565 30.5461 77.454 18.2471 109.558C19.7381 116.911 32.5911 167.869 103.522 167.869C134.13 167.869 156.503 156.255 163.365 152.205L156.036 135.807Z" fill="#1F427C"/><path d="M64.2171 62.567L68.2811 57.102L48.4941 43.426L54.1681 60.089L64.2171 62.567Z" fill="#1F427C"/><path d="M155.948 87.072C155.889 87.222 155.937 87.295 156.148 87.461C156.394 87.645 159.677 89.335 159.931 89.368C160.188 89.395 160.41 89.395 160.667 89.334C160.852 89.292 161.986 88.565 162.758 88.036L158.39 85.701C157.259 86.26 156.057 86.923 155.948 87.072Z" fill="white"/><path d="M59.413 107.904L59.419 107.937C60.182 107.177 75.685 91.725 91.934 88.402L104.608 78.609C74.324 80.383 60.19 106.442 59.413 107.904Z" fill="white"/><path d="M176.259 86.923C176.259 83.084 171.188 80.471 166.888 77.008C149.891 75.106 145.246 71.012 145.246 68.398C145.246 67.372 146.112 67.133 146.935 67.133C150.793 67.133 155.882 69.864 158.777 72.962C157.097 68.517 146.89 63.276 140.273 63.276C139.025 63.276 137.19 63.669 137.19 65.662C137.19 69.852 143.485 75.163 159.685 76.461C168.357 78.524 177.385 83.366 175.654 89.623C175.969 88.99 176.259 88.103 176.259 86.923Z" fill="white"/><path d="M144.395 86.892L150.699 89.127C151.865 88.626 153.128 88.023 153.234 87.855C153.315 87.695 153.315 87.557 153.043 87.312C152.858 87.146 150.035 86.076 148.282 85.441L144.395 86.892Z" fill="white"/><path d="M149.717 84.896C151.386 85.572 153.721 86.494 153.909 86.541C154.173 86.586 154.609 86.603 154.88 86.541C155.083 86.479 156.463 85.785 157.481 85.273C156.489 84.785 154.533 83.867 153.196 83.867C151.938 83.868 149.717 84.896 149.717 84.896Z" fill="white"/><path d="M159.059 90.546C159.134 90.384 159.172 90.274 159.13 90.121C158.917 89.881 155.668 88.207 155.324 88.146C154.946 88.099 154.74 88.099 154.41 88.249C154.135 88.372 152.483 89.294 151.894 89.624L156.965 91.936C157.923 91.345 158.957 90.665 159.059 90.546Z" fill="white"/><path d="M165.278 92.332C165.392 92.359 165.72 92.268 166.071 92.145C166.259 92.07 167.004 91.465 167.509 91.044L163.598 88.552C162.66 89.136 161.672 89.82 161.563 89.954C161.563 89.985 161.576 90.077 161.791 90.362L165.278 92.332Z" fill="white"/><path d="M166.888 92.721C166.774 92.949 166.763 93.04 166.823 93.113C166.951 93.233 168.982 94.582 170.357 95.505L171.946 93.916L168.337 91.584C167.659 92.057 166.96 92.599 166.888 92.721Z" fill="white"/><path d="M164.662 93.385C164.727 93.269 164.692 93.082 164.546 92.947C164.343 92.754 161.217 91.06 160.981 91.03C160.715 90.969 160.236 91.045 159.98 91.118C159.852 91.153 158.934 91.787 158.076 92.401L162.863 94.64C163.691 94.098 164.582 93.51 164.662 93.385Z" fill="white"/><path d="M165.491 94.021C165.363 94.061 164.454 94.76 163.791 95.277L168.114 97.967L169.736 96.198C168.42 95.286 166.506 93.99 166.345 93.915C166.176 93.87 165.71 93.945 165.491 94.021Z" fill="white"/><path d="M131.446 87.828C154.794 94.022 164.753 102.119 164.753 102.119L167.239 99.32C166.07 98.465 157.467 92.514 140.626 86.995C145.645 84.999 151.715 82.659 153.359 82.659C157.085 82.659 164.727 87.51 172.949 92.89L174.823 90.773C167.634 85.816 159.196 79.94 153.125 79.94C148.201 79.94 141.09 82.989 131.446 87.828Z" fill="white"/><path d="M111.052 48.802C111.052 48.802 105.569 46.493 104.071 44.617C102.592 42.745 100.854 24.086 100.854 24.086C100.854 24.086 100.551 43.139 99.466 44.828C98.355 46.525 92.901 49.663 92.901 49.663C92.901 49.663 98.95 47.685 101.929 47.522C104.107 47.385 111.052 48.802 111.052 48.802Z" fill="white"/><path d="M170.356 95.504C168.98 94.582 166.947 93.231 166.821 93.116C166.761 93.038 166.772 92.948 166.886 92.72C166.958 92.597 167.657 92.059 168.337 91.588L171.941 93.914L170.356 95.504ZM168.113 97.968L163.79 95.278C164.447 94.759 165.362 94.067 165.49 94.023C165.709 93.946 166.175 93.87 166.344 93.915C166.505 93.992 168.419 95.288 169.735 96.2L168.113 97.968ZM158.076 92.401C158.934 91.787 159.847 91.15 159.979 91.118C160.235 91.045 160.715 90.969 160.978 91.03C161.217 91.06 164.344 92.754 164.542 92.947C164.692 93.082 164.727 93.269 164.662 93.385C164.581 93.508 163.69 94.098 162.86 94.64L158.076 92.401ZM151.894 89.624C152.483 89.294 154.133 88.371 154.411 88.249C154.741 88.099 154.947 88.099 155.325 88.146C155.669 88.207 158.918 89.881 159.131 90.121C159.173 90.274 159.135 90.384 159.06 90.546C158.958 90.666 157.924 91.346 156.968 91.937L151.894 89.624ZM144.395 86.893L148.282 85.442C150.035 86.076 152.86 87.146 153.043 87.312C153.318 87.557 153.318 87.697 153.234 87.855C153.126 88.024 151.865 88.626 150.699 89.129L144.395 86.893ZM153.191 83.868C154.528 83.868 156.487 84.786 157.479 85.274C156.466 85.788 155.082 86.48 154.878 86.542C154.607 86.606 154.175 86.587 153.905 86.542C153.717 86.495 151.384 85.576 149.716 84.897C149.716 84.897 151.936 83.868 153.191 83.868ZM162.761 88.038C161.99 88.568 160.853 89.294 160.668 89.336C160.411 89.398 160.189 89.398 159.932 89.371C159.675 89.336 156.398 87.644 156.152 87.463C155.937 87.297 155.889 87.224 155.952 87.074C156.057 86.925 157.259 86.259 158.39 85.699L162.761 88.038ZM167.51 91.045C167.006 91.468 166.263 92.071 166.073 92.144C165.719 92.269 165.392 92.359 165.278 92.331L161.788 90.364C161.576 90.078 161.566 89.987 161.566 89.956C161.671 89.821 162.657 89.138 163.598 88.554L167.51 91.045ZM169.307 75.15C162.236 56.012 123.161 52.518 118.839 43.501C117.111 39.878 114.899 31.218 111.651 20.676C109.062 13.061 101.434 13.061 97.618 13.061C93.961 13.061 89.236 13.817 89.236 13.817C89.236 21.595 87.766 44.24 84.148 48.173C83.248 49.288 76.593 51.98 69.346 54.772L71.514 56.234L69.3 58.443C76.502 54.65 82.537 53.324 86.123 50.317C91.441 44.953 92.14 19.271 92.14 16.355C92.14 16.355 102.661 14.92 106.76 18.079C110.493 20.93 114.199 41.885 116.437 45.149C124.505 56.931 160.365 58.263 166.888 77.009C171.189 80.469 176.26 83.084 176.26 86.925C176.26 88.1 175.97 88.991 175.655 89.625C175.273 90.4 174.829 90.773 174.829 90.773L172.947 92.889C164.729 87.513 157.087 82.662 153.357 82.662C151.716 82.662 145.645 85 140.624 86.995C157.469 92.512 166.074 98.465 167.241 99.319L164.756 102.119C164.756 102.119 154.798 94.022 131.45 87.828C121.4 92.859 108.581 99.823 92.587 107.26C87.498 108.704 66.79 107.83 66.79 107.83L91.936 88.405C75.685 91.727 60.182 107.18 59.419 107.94C61.627 118.795 72.231 141.189 109.69 141.189C136.758 141.189 157.667 131.733 157.667 131.733L167.368 153.44C167.368 153.44 141.962 171.042 103.524 171.042C24.961 171.042 14.978 109.253 14.978 109.253C25.821 80.279 44.059 67.571 55.655 62.21L52.02 61.8L51.719 60.728C21.034 77.645 11.98 108.951 11.98 108.951C11.98 108.951 21.294 173.957 103.523 173.957C145.585 173.957 171.032 154.452 171.032 154.452L159.135 127.85C159.135 127.85 136.914 138.274 109.69 138.274C69.132 138.274 63.124 110.595 63.124 110.595C63.124 110.595 86.224 111.986 93.604 110.003L131.777 90.94C157.637 98.233 165.089 106.139 165.089 106.139L176.931 92.803C176.931 92.803 179.103 90.776 179.103 86.197C179.101 81.89 172.707 77.599 169.307 75.15Z" fill="#1F427C"/><path d="M101.926 47.524C98.949 47.686 92.902 49.664 92.902 49.664C92.902 49.664 98.353 46.526 99.464 44.83C100.549 43.139 100.853 24.086 100.853 24.086C100.853 24.086 102.591 42.747 104.07 44.618C105.568 46.496 111.053 48.805 111.053 48.805C111.053 48.805 104.106 47.383 101.926 47.524ZM66.777 79.621L76.513 74.185L86.143 82.235L66.777 79.621ZM82.906 56.131L70.876 75.333L66.644 65.225L82.906 56.131ZM63.949 89.415L43.157 92.543L65.652 77.403L63.949 89.415ZM159.688 76.464C143.486 75.164 137.192 69.85 137.192 65.663C137.192 63.67 139.026 63.275 140.275 63.275C146.892 63.275 157.099 68.514 158.779 72.964C155.885 69.865 150.796 67.133 146.937 67.133C146.114 67.133 145.252 67.373 145.252 68.398C145.252 71.013 149.893 75.107 166.889 77.009C160.365 58.263 124.504 56.93 116.437 45.149C114.198 41.884 110.495 20.931 106.759 18.08C102.662 14.921 92.141 16.356 92.141 16.356C92.141 19.272 91.443 44.954 86.121 50.318C82.536 53.325 76.503 54.654 69.3 58.444L65.13 62.631L60.543 76.964L54.577 73.853L56.712 79.154L46.056 80.923L52.078 82.982L34.744 96.32L39.427 96.683L33.25 107.843C42.167 103.81 44.867 103.026 44.867 103.026L42.307 100.397L60.276 93.159C60.276 93.159 58.918 96.755 58.918 103.734C58.918 104.733 59.072 106.186 59.412 107.906C60.193 106.443 74.325 80.385 104.609 78.612L66.787 107.831C66.787 107.831 87.495 108.711 92.584 107.261C108.577 99.826 121.397 92.859 131.444 87.829C141.085 82.991 148.195 79.94 153.123 79.94C159.194 79.94 167.636 85.819 174.825 90.774C174.825 90.774 175.269 90.4 175.652 89.626C177.387 83.369 168.358 78.521 159.688 76.464Z" fill="#152F55"/><path d="M62.4171 88.28L63.8601 80.107L48.6341 90.424L62.4171 88.28Z" fill="#0A6DB5"/><path d="M70.0691 79.111L82.7101 80.636L75.2961 76.314L70.0691 79.111Z" fill="#0A6DB5"/><path d="M79.3941 59.981L69.0971 65.787L70.5201 72.006L79.3941 59.981Z" fill="#0A6DB5"/><path d="M156.036 135.807C149.25 138.436 131.53 144.36 109.688 144.36C66.5871 144.36 55.7521 114.842 55.7521 103.738C55.7521 101.277 55.9171 99.202 56.1241 97.497L46.2151 100.789L47.5011 103.588L39.7691 106.379L33.1041 110.745L46.6461 113.257L43.8541 122.928L49.6601 121.202L55.2401 135.387L61.9081 134.524L64.1221 144.481C64.1221 144.481 76.6741 153.182 97.9311 155.085C126.014 157.594 151.157 148.017 151.157 148.017C151.157 148.017 121.176 159.772 93.9281 156.868C73.1131 154.665 59.5471 146.205 59.5471 146.205L59.3691 137.216L51.1581 137.324L47.2901 123.574L39.9801 127.008L43.2051 114.692L29.1711 112.969L32.0351 104.372L35.3711 97.668L30.8891 97.784L49.6591 83.811L41.4841 80.58L54.8081 78.015L50.1711 68.66L58.3811 73.335L61.6511 63.12C51.7721 66.565 30.5461 77.454 18.2471 109.558C19.7381 116.911 32.5911 167.869 103.522 167.869C134.13 167.869 156.503 156.255 163.365 152.205L156.036 135.807Z" fill="#0A6DB5"/><path d="M64.2171 62.567L68.2811 57.102L48.4941 43.426L54.1681 60.089L64.2171 62.567Z" fill="#0A6DB5"/><path d="M111.052 48.802C111.052 48.802 105.569 46.493 104.071 44.617C102.592 42.745 100.854 24.086 100.854 24.086C100.854 24.086 100.551 43.139 99.4661 44.828C98.3551 46.525 92.9011 49.663 92.9011 49.663C92.9011 49.663 98.9501 47.685 101.929 47.522C104.107 47.385 111.052 48.802 111.052 48.802Z" fill="#0A6DB5"/><path d="M170.356 95.504C168.98 94.582 166.947 93.231 166.821 93.116C166.761 93.038 166.772 92.948 166.886 92.72C166.958 92.597 167.657 92.059 168.337 91.588L171.941 93.914L170.356 95.504ZM168.113 97.968L163.79 95.278C164.447 94.759 165.362 94.067 165.49 94.023C165.709 93.946 166.175 93.87 166.344 93.915C166.505 93.992 168.419 95.288 169.735 96.2L168.113 97.968ZM158.075 92.401C158.933 91.787 159.847 91.15 159.979 91.118C160.235 91.045 160.715 90.969 160.978 91.03C161.217 91.06 164.344 92.754 164.542 92.947C164.692 93.082 164.727 93.269 164.662 93.385C164.581 93.508 163.69 94.098 162.86 94.64L158.075 92.401ZM151.895 89.624C152.484 89.294 154.133 88.371 154.411 88.249C154.741 88.099 154.947 88.099 155.325 88.146C155.669 88.207 158.918 89.881 159.131 90.121C159.173 90.274 159.135 90.384 159.06 90.546C158.958 90.666 157.924 91.346 156.968 91.937L151.895 89.624ZM144.395 86.893L148.282 85.442C150.035 86.076 152.86 87.145 153.043 87.311C153.318 87.556 153.318 87.697 153.234 87.855C153.126 88.024 151.865 88.626 150.699 89.129L144.395 86.893ZM153.191 83.868C154.528 83.868 156.487 84.786 157.479 85.274C156.466 85.788 155.082 86.48 154.878 86.542C154.607 86.606 154.175 86.587 153.905 86.542C153.717 86.495 151.384 85.576 149.716 84.897C149.716 84.897 151.936 83.868 153.191 83.868ZM162.761 88.038C161.99 88.568 160.853 89.294 160.668 89.336C160.411 89.398 160.189 89.398 159.932 89.371C159.675 89.336 156.398 87.644 156.152 87.463C155.937 87.297 155.889 87.224 155.952 87.074C156.057 86.925 157.259 86.259 158.39 85.699L162.761 88.038ZM167.51 91.045C167.006 91.468 166.263 92.071 166.073 92.144C165.719 92.269 165.392 92.359 165.278 92.331L161.788 90.364C161.576 90.078 161.566 89.987 161.566 89.956C161.671 89.821 162.657 89.138 163.598 88.554L167.51 91.045ZM169.307 75.15C162.236 56.012 123.161 52.518 118.839 43.501C117.111 39.878 114.899 31.218 111.651 20.676C109.062 13.061 101.434 13.061 97.618 13.061C93.961 13.061 89.236 13.817 89.236 13.817C89.236 21.595 87.766 44.24 84.148 48.173C83.248 49.288 76.593 51.98 69.346 54.772L71.514 56.234L69.3 58.443C76.502 54.65 82.537 53.324 86.123 50.317C91.441 44.953 92.14 19.271 92.14 16.355C92.14 16.355 102.661 14.92 106.76 18.079C110.493 20.93 114.199 41.885 116.437 45.149C124.505 56.931 160.365 58.263 166.888 77.009C171.189 80.469 176.26 83.084 176.26 86.925C176.26 88.1 175.97 88.991 175.655 89.625C175.273 90.4 174.829 90.773 174.829 90.773L172.947 92.889C164.729 87.513 157.087 82.662 153.357 82.662C151.716 82.662 145.645 85 140.624 86.995C157.469 92.512 166.074 98.465 167.241 99.319L164.756 102.119C164.756 102.119 154.798 94.022 131.45 87.828C121.4 92.859 108.581 99.823 92.587 107.26C87.498 108.704 66.79 107.83 66.79 107.83L91.936 88.405C75.685 91.727 60.182 107.18 59.419 107.94C61.627 118.795 72.231 141.189 109.69 141.189C136.758 141.189 157.667 131.733 157.667 131.733L167.368 153.44C167.368 153.44 141.962 171.042 103.524 171.042C24.961 171.042 14.978 109.253 14.978 109.253C25.821 80.279 44.059 67.571 55.655 62.21L52.02 61.8L51.719 60.728C21.034 77.645 11.98 108.951 11.98 108.951C11.98 108.951 21.294 173.957 103.523 173.957C145.585 173.957 171.032 154.452 171.032 154.452L159.135 127.85C159.135 127.85 136.914 138.274 109.69 138.274C69.132 138.274 63.124 110.595 63.124 110.595C63.124 110.595 86.224 111.986 93.604 110.003L131.777 90.94C157.637 98.233 165.089 106.139 165.089 106.139L176.931 92.803C176.931 92.803 179.103 90.776 179.103 86.197C179.101 81.89 172.707 77.599 169.307 75.15Z" fill="#90192B"/></svg>`;

const COLORS = {
  ice: "#eaf1f7",
  crease: "#cfe0f2",
  red: "#c8102e",
  blue: "#00205b",
  green: "#00843d",
  net: "#b8c2cc",
  puck: "#141414",
};

interface Puck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}
interface Goalie {
  x: number;
  y: number;
  w: number;
  h: number;
  dir: number;
  speed: number;
}
interface Goal {
  left: number;
  right: number;
  lineY: number;
  topY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** True when the puck circle overlaps the (centre-anchored) goalie rectangle. */
function puckHitsGoalie(puck: Puck, goalie: Goalie): boolean {
  const nearestX = clamp(
    puck.x,
    goalie.x - goalie.w / 2,
    goalie.x + goalie.w / 2,
  );
  const nearestY = clamp(
    puck.y,
    goalie.y - goalie.h / 2,
    goalie.y + goalie.h / 2,
  );
  const dx = puck.x - nearestX;
  const dy = puck.y - nearestY;
  return dx * dx + dy * dy < puck.r * puck.r;
}

// A small shootout: drag back from the puck and release to shoot past the goalie. Pointer-events based, so mouse or touch works.
export function HockeyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [goals, setGoals] = useState(0);
  const [shots, setShots] = useState(0);

  useEffect(() => {
    const element = canvasRef.current;
    if (element === null) return;
    // Pin non-null declared types so the narrowing survives into the nested draw closures.
    const canvas: HTMLCanvasElement = element;
    const context = canvas.getContext("2d");
    if (context === null) return;
    const ctx: CanvasRenderingContext2D = context;

    // Load the pasted center-ice SVG (if any) as an image to draw onto the ice.
    const logoImage = new Image();
    let logoReady = false;
    if (CENTER_LOGO_SVG.includes("<svg")) {
      logoImage.onload = () => {
        logoReady = true;
      };
      logoImage.src = `data:image/svg+xml,${encodeURIComponent(CENTER_LOGO_SVG.trim())}`;
    }

    const start = { x: LOGICAL_W / 2, y: LOGICAL_H - 56 };
    const puck: Puck = { x: start.x, y: start.y, vx: 0, vy: 0, r: 11 };
    const goal: Goal = {
      left: LOGICAL_W / 2 - 74,
      right: LOGICAL_W / 2 + 74,
      lineY: 74,
      topY: 34,
    };
    const goalie: Goalie = {
      x: LOGICAL_W / 2,
      y: 98,
      w: 60,
      h: 20,
      dir: 1,
      speed: 105,
    };

    let ready = true;
    let aiming = false;
    let scored = false;
    const aim = { x: 0, y: 0 };
    let resetTimer = -1;
    let flash = 0;

    function resetPuck() {
      puck.x = start.x;
      puck.y = start.y;
      puck.vx = 0;
      puck.vy = 0;
      ready = true;
      scored = false;
    }

    function toLocal(clientX: number, clientY: number) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * LOGICAL_W,
        y: ((clientY - rect.top) / rect.height) * LOGICAL_H,
      };
    }

    function handleDown(event: PointerEvent) {
      if (!ready) return;
      aiming = true;
      const point = toLocal(event.clientX, event.clientY);
      aim.x = point.x;
      aim.y = point.y;
      canvas.setPointerCapture(event.pointerId);
    }
    function handleMove(event: PointerEvent) {
      if (!aiming) return;
      const point = toLocal(event.clientX, event.clientY);
      aim.x = point.x;
      aim.y = point.y;
    }
    function handleUp() {
      if (!aiming) return;
      aiming = false;
      // Slingshot: shoot away from the drag (pull back to fire toward the net).
      const dx = puck.x - aim.x;
      const dy = puck.y - aim.y;
      const dist = Math.hypot(dx, dy);
      if (dist < MIN_DRAG) return;
      const power = (Math.min(dist, MAX_DRAG) / MAX_DRAG) * MAX_SPEED;
      puck.vx = (dx / dist) * power;
      puck.vy = (dy / dist) * power;
      ready = false;
      setShots((count) => count + 1);
    }

    canvas.addEventListener("pointerdown", handleDown);
    canvas.addEventListener("pointermove", handleMove);
    canvas.addEventListener("pointerup", handleUp);
    canvas.addEventListener("pointercancel", handleUp);

    let scale = 1;
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      scale = (cssW / LOGICAL_W) * dpr;
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    function update(dt: number) {
      // Goalie slides across the crease.
      goalie.x += goalie.dir * goalie.speed * dt;
      const min = goal.left + goalie.w / 2 + 4;
      const max = goal.right - goalie.w / 2 - 4;
      if (goalie.x <= min) {
        goalie.x = min;
        goalie.dir = 1;
      } else if (goalie.x >= max) {
        goalie.x = max;
        goalie.dir = -1;
      }

      if (flash > 0) flash -= dt;

      if (resetTimer >= 0) {
        resetTimer -= dt;
        if (resetTimer <= 0) {
          resetTimer = -1;
          resetPuck();
        }
      }

      if (ready) return;

      puck.x += puck.vx * dt;
      puck.y += puck.vy * dt;
      const damp = Math.exp(-0.55 * dt);
      puck.vx *= damp;
      puck.vy *= damp;

      // Side and bottom boards.
      if (puck.x < puck.r) {
        puck.x = puck.r;
        puck.vx = Math.abs(puck.vx) * 0.8;
      } else if (puck.x > LOGICAL_W - puck.r) {
        puck.x = LOGICAL_W - puck.r;
        puck.vx = -Math.abs(puck.vx) * 0.8;
      }
      if (puck.y > LOGICAL_H - puck.r) {
        puck.y = LOGICAL_H - puck.r;
        puck.vy = -Math.abs(puck.vy) * 0.8;
      }

      // Goalie save.
      if (!scored && puckHitsGoalie(puck, goalie)) {
        puck.y = goalie.y + goalie.h / 2 + puck.r + 1;
        puck.vy = Math.abs(puck.vy) * 0.55 + 40;
        puck.vx *= 0.7;
      }

      // Goal line: score if between the posts, otherwise bounce off the boards behind.
      if (!scored && puck.y - puck.r < goal.lineY) {
        if (puck.x > goal.left && puck.x < goal.right) {
          scored = true;
          flash = 1;
          puck.vx *= 0.3;
          puck.vy *= 0.3;
          resetTimer = 0.9;
          setGoals((count) => count + 1);
        } else {
          puck.y = goal.lineY + puck.r;
          puck.vy = Math.abs(puck.vy) * 0.7;
        }
      }

      // Come to rest → reload.
      if (resetTimer < 0 && Math.hypot(puck.vx, puck.vy) < 16) {
        resetTimer = 0.25;
      }
    }

    function drawRink() {
      ctx.fillStyle = COLORS.ice;
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      // Goal crease.
      ctx.fillStyle = COLORS.crease;
      ctx.beginPath();
      ctx.moveTo(goal.left + 8, goal.lineY);
      ctx.arc(LOGICAL_W / 2, goal.lineY, 62, 0, Math.PI);
      ctx.closePath();
      ctx.fill();

      // Goal line.
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, goal.lineY);
      ctx.lineTo(LOGICAL_W, goal.lineY);
      ctx.stroke();

      // Faceoff spot near the shooter.
      ctx.fillStyle = COLORS.red;
      ctx.beginPath();
      ctx.arc(start.x, start.y - 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawMapleLeaves() {
      const leaves = [
        { x: 46, y: 178, s: 26, r: -0.3 },
        { x: 314, y: 162, s: 22, r: 0.4 },
        { x: 54, y: 338, s: 30, r: 0.2 },
        { x: 306, y: 344, s: 24, r: -0.45 },
        { x: 96, y: 420, s: 20, r: 0.5 },
        { x: 264, y: 416, s: 22, r: -0.2 },
      ];
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const leaf of leaves) {
        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.r);
        ctx.font = `${String(leaf.s)}px system-ui, sans-serif`;
        ctx.fillText("🍁", 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    // Draws the center-ice logo image once it has loaded.
    function drawCenterLogo() {
      if (!logoReady) return;
      const cx = LOGICAL_W / 2;
      const cy = 250;
      const ratio =
        logoImage.naturalWidth > 0
          ? logoImage.naturalWidth / logoImage.naturalHeight
          : 1;
      const height = 90;
      const width = height * ratio;
      ctx.drawImage(logoImage, cx - width / 2, cy - height / 2, width, height);
    }

    function drawNet() {
      // Net mesh.
      ctx.strokeStyle = COLORS.net;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = goal.left; x <= goal.right; x += 10) {
        ctx.moveTo(x, goal.topY);
        ctx.lineTo(x, goal.lineY);
      }
      for (let y = goal.topY; y <= goal.lineY; y += 10) {
        ctx.moveTo(goal.left, y);
        ctx.lineTo(goal.right, y);
      }
      ctx.stroke();

      // Frame (posts + crossbar).
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(goal.left, goal.lineY);
      ctx.lineTo(goal.left, goal.topY);
      ctx.lineTo(goal.right, goal.topY);
      ctx.lineTo(goal.right, goal.lineY);
      ctx.stroke();
    }

    function drawGoalie() {
      const x = goalie.x - goalie.w / 2;
      const y = goalie.y - goalie.h / 2;
      ctx.fillStyle = COLORS.blue;
      ctx.beginPath();
      ctx.roundRect(x, y, goalie.w, goalie.h, 6);
      ctx.fill();
      ctx.fillStyle = COLORS.green;
      ctx.beginPath();
      ctx.roundRect(x, y + goalie.h - 6, goalie.w, 5, 3);
      ctx.fill();
    }

    function drawPuck() {
      ctx.fillStyle = COLORS.puck;
      ctx.beginPath();
      ctx.arc(puck.x, puck.y, puck.r, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawAim() {
      if (!aiming) return;
      const dx = puck.x - aim.x;
      const dy = puck.y - aim.y;
      const dist = Math.hypot(dx, dy);
      if (dist < MIN_DRAG) return;
      const power = Math.min(dist, MAX_DRAG) / MAX_DRAG;
      const len = power * 84;
      const nx = dx / dist;
      const ny = dy / dist;

      ctx.strokeStyle = `rgb(${String(Math.round(60 + power * 180))}, ${String(Math.round(160 - power * 120))}, 90)`;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(puck.x, puck.y);
      ctx.lineTo(puck.x + nx * len, puck.y + ny * len);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function drawFlash() {
      if (flash <= 0) return;
      ctx.fillStyle = `rgba(0, 132, 61, ${String(Math.min(flash, 1) * 0.9)})`;
      ctx.font = "bold 34px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("GOAL!", LOGICAL_W / 2, LOGICAL_H / 2);
    }

    function render() {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
      drawRink();
      drawMapleLeaves();
      drawCenterLogo();
      drawNet();
      drawGoalie();
      drawAim();
      drawPuck();
      drawFlash();
    }

    let raf = 0;
    let last = performance.now();
    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      update(dt);
      render();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", handleDown);
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerup", handleUp);
      canvas.removeEventListener("pointercancel", handleUp);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-s">
      <div className="flex w-full max-w-sm items-center justify-between">
        <Helper className="tabular-nums text-foreground-default">
          Goals {goals}
        </Helper>
        <Helper className="tabular-nums opacity-60">Shots {shots}</Helper>
      </div>
      <canvas
        ref={canvasRef}
        className="aspect-[3/4] w-full max-w-sm touch-none rounded-large border border-border-default"
      />
      <Helper className="tracking-widest opacity-60">
        Drag back from the puck, release to shoot
      </Helper>
    </div>
  );
}
