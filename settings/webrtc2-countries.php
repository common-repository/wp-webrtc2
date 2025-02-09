<?php
/**
 * Description: Creates a table prefix_watchman_site_countries reference data about ip visitors.
 *
 * PHP version 8.0.1
 *
 * @category module
 * @package  settings
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 * @filesource
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit();
}

/**
 * Populate the data in table prefix_watchman_site_countries.
 *
 * @return string
 */
function webrtc2_sql_countries() {
	$str = "
	('AF', 'Afghanistan', 33, 65),
	('AX', 'Åland Islands', 60.1166, 19.9),
	('AL', 'Albania', 41, 20),
	('DZ', 'Algeria', 28, 3),
	('AS', 'American Samoa', -14.3333, -170),
	('AD', 'Andorra', 42.5, 1.5),
	('AO', 'Angola', -12.5, 18.5),
	('AI', 'Anguilla', 18.25, -63.1667),
	('AQ', 'Antarctica', -90, 0),
	('AG', 'Antigua and Barbuda', 17.05, -61.8),
	('AR', 'Argentina', -34, -64),
	('AM', 'Armenia', 40, 45),
	('AW', 'Aruba', 12.5, -69.9667),
	('AU', 'Australia', -27, 133),
	('AT', 'Austria', 47.3333, 13.3333),
	('AZ', 'Azerbaijan', 40.5, 47.5),
	('BS', 'Bahamas', 24.25, -76),
	('BH', 'Bahrain', 26, 50.55),
	('BD', 'Bangladesh', 24, 90),
	('BB', 'Barbados', 13.1667, -59.5333),
	('BY', 'Belarus', 53, 28),
	('BE', 'Belgium', 50.8333, 4),
	('BZ', 'Belize', 17.25, -88.75),
	('BJ', 'Benin', 9.5, 2.25),
	('BM', 'Bermuda', 32.3333, -64.75),
	('BT', 'Bhutan', 27.5, 90.5),
	('BO', 'Bolivia', -17, -65),
	('BQ', 'Bonaire, Sint Eustatius and Saba', 12.25, 68.4667),
	('BA', 'Bosnia and Herzegovina', 44, 18),
	('BW', 'Botswana', -22, 24),
	('BV', 'Bouvet Island', -54.4333, 3.4),
	('BR', 'Brazil', -10, -55),
	('IO', 'British Indian Ocean Territory', -6, 71.5),
	('BN', 'Brunei Darussalam', 4.5, 114.667),
	('BG', 'Bulgaria', 43, 25),
	('BF', 'Burkina Faso', 13, -2),
	('BI', 'Burundi', -3.5, 30),
	('KH', 'Cambodia', 13, 105),
	('CM', 'Cameroon', 6, 12),
	('CA', 'Canada', 60, -95),
	('CV', 'Cape Verde', 16, -24),
	('KY', 'Cayman Islands', 19.5, -80.5),
	('CF', 'Central African Republic', 7, 21),
	('TD', 'Chad', 15, 19),
	('CL', 'Chile', -30, -71),
	('CN', 'China', 35, 105),
	('CX', 'Christmas Island', -10.5, 105.667),
	('CC', 'Cocos (Keeling) Islands', -12.5, 96.8333),
	('CO', 'Colombia', 4, -72),
	('KM', 'Comoros', -12.1667, 44.25),
	('CD', 'The Democratic Republic of the Congo', 0, 25),
	('CG', 'Congo', -1, 15),
	('CK', 'Cook Islands', -21.2333, -159.767),
	('CR', 'Costa Rica', 10, -84),
	('CI', 'Cote d''Ivoire', 8, -5),
	('HR', 'Croatia', 45.1667, 15.5),
	('CU', 'Cuba', 21.5, -80),
	('CW', 'Curaçao', 12.1167, 68.9333),
	('CY', 'Cyprus', 35, 33),
	('CZ', 'Czech Republic', 49.75, 15.5),
	('DK', 'Denmark', 56, 10),
	('DJ', 'Djibouti', 11.5, 43),
	('DM', 'Dominica', 15.4167, -61.3333),
	('DO', 'Dominican Republic', 19, -70.6667),
	('EC', 'Ecuador', -2, -77.5),
	('EG', 'Egypt', 27, 30),
	('SV', 'El Salvador', 13.8333, -88.9167),
	('GQ', 'Equatorial Guinea', 2, 10),
	('ER', 'Eritrea', 15, 39),
	('EE', 'Estonia', 59, 26),
	('ET', 'Ethiopia', 8, 38),
	('FK', 'Falkland Islands (Malvinas)', -51.75, -59),
	('FO', 'Faroe Islands', 62, -7),
	('FJ', 'Fiji', -18, 175),
	('FI', 'Finland', 64, 26),
	('FR', 'France', 46, 2),
	('GF', 'French Guiana', 4, -53),
	('PF', 'French Polynesia', -15, -140),
	('TF', 'French Southern Territories', -43, 67),
	('GA', 'Gabon', -1, 11.75),
	('GM', 'Gambia', 13.4667, -16.5667),
	('GE', 'Georgia', 42, 43.5),
	('DE', 'Germany', 51, 9),
	('GH', 'Ghana', 8, -2),
	('GI', 'Gibraltar', 36.1833, -5.3667),
	('GR', 'Greece', 39, 22),
	('GL', 'Greenland', 72, -40),
	('GD', 'Grenada', 12.1167, -61.6667),
	('GP', 'Guadeloupe', 16.25, -61.5833),
	('GU', 'Guam', 13.4667, 144.783),
	('GT', 'Guatemala', 15.5, -90.25),
	('GG', 'Guernsey', 49.45, -2.5333),
	('GN', 'Guinea', 11, -10),
	('GW', 'Guinea-Bissau', 12, -15),
	('GY', 'Guyana', 5, -59),
	('HT', 'Haiti', 19, -72.4167),
	('HM', 'Heard Island and McDonald Islands', -53.1, 72.5167),
	('VA', 'Holy See (Vatican City State)', 41.9, 12.45),
	('HN', 'Honduras', 15, -86.5),
	('HK', 'Hong Kong', 22.25, 114.167),
	('HU', 'Hungary', 47, 20),
	('IS', 'Iceland', 65, -18),
	('IN', 'India', 20, 77),
	('ID', 'Indonesia', -5, 120),
	('IR', 'Iran', 32, 53),
	('IQ', 'Iraq', 33, 44),
	('IE', 'Ireland', 53, -8),
	('IM', 'Isle of Man', 54.15, -4.4833),
	('IL', 'Israel', 31.5, 34.75),
	('IT', 'Italy', 42.8333, 12.8333),
	('JM', 'Jamaica', 18.25, -77.5),
	('JP', 'Japan', 36, 138),
	('JE', 'Jersey', 49.19, -2.11),
	('JO', 'Jordan', 31, 36),
	('KZ', 'Kazakhstan', 48, 68),
	('KE', 'Kenya', 1, 38),
	('KI', 'Kiribati', 1.4167, 173),
	('KP', 'North Korea', 40, 127),
	('KR', 'South Korea', 37, 127.5),
	('KW', 'Kuwait', 29.3375, 47.6581),
	('KG', 'Kyrgyzstan', 41, 75),
	('LA', 'Lao', 18, 105),
	('LV', 'Latvia', 57, 25),
	('LB', 'Lebanon', 33.8333, 35.8333),
	('LS', 'Lesotho', -29.5, 28.5),
	('LR', 'Liberia', 6.5, -9.5),
	('LY', 'Libyan Arab Jamahiriya', 25, 17),
	('LI', 'Liechtenstein', 47.1667, 9.5333),
	('LT', 'Lithuania', 56, 24),
	('LU', 'Luxembourg', 49.75, 6.1667),
	('MO', 'Macao', 22.1667, 113.55),
	('MK', 'Macedonia', 41.8333, 22),
	('MG', 'Madagascar', -20, 47),
	('MW', 'Malawi', -13.5, 34),
	('MY', 'Malaysia', 2.5, 112.5),
	('MV', 'Maldives', 3.25, 73),
	('ML', 'Mali', 17, -4),
	('MT', 'Malta', 35.8333, 14.5833),
	('MH', 'Marshall Islands', 9, 168),
	('MQ', 'Martinique', 14.6667, -61),
	('MR', 'Mauritania', 20, -12),
	('MU', 'Mauritius', -20.2833, 57.55),
	('YT', 'Mayotte', -12.8333, 45.1667),
	('MX', 'Mexico', 23, -102),
	('FM', 'Micronesia', 6.9167, 158.25),
	('MD', 'Moldova', 47, 29),
	('MC', 'Monaco', 43.7333, 7.4),
	('MN', 'Mongolia', 46, 105),
	('ME', 'Montenegro', 42, 19),
	('MS', 'Montserrat', 16.75, -62.2),
	('MA', 'Morocco', 32, -5),
	('MZ', 'Mozambique', -18.25, 35),
	('MM', 'Myanmar', 22, 98),
	('NA', 'Namibia', -22, 17),
	('NR', 'Nauru', -0.5333, 166.917),
	('NP', 'Nepal', 28, 84),
	('NL', 'Netherlands', 52.5, 5.75),
	('NC', 'New Caledonia', -21.5, 165.5),
	('NZ', 'New Zealand', -41, 174),
	('NI', 'Nicaragua', 13, -85),
	('NE', 'Niger', 16, 8),
	('NG', 'Nigeria', 10, 8),
	('NU', 'Niue', -19.0333, -169.867),
	('NF', 'Norfolk Island', -29.0333, 167.95),
	('MP', 'Northern Mariana Islands', 15.2, 145.75),
	('NO', 'Norway', 62, 10),
	('OM', 'Oman', 21, 57),
	('PK', 'Pakistan', 30, 70),
	('PW', 'Palau', 7.5, 134.5),
	('PS', 'Palestinian Territory', 32, 35.25),
	('PA', 'Panama', 9, -80),
	('PG', 'Papua New Guinea', -6, 147),
	('PY', 'Paraguay', -23, -58),
	('PE', 'Peru', -10, -76),
	('PH', 'Philippines', 13, 122),
	('PN', 'Pitcairn Islands', -25.0666, -130.1),
	('PL', 'Poland', 52, 20),
	('PT', 'Portugal', 39.5, -8),
	('PR', 'Puerto Rico', 18.25, -66.5),
	('QA', 'Qatar', 25.5, 51.25),
	('RE', 'Reunion', -21.1, 55.6),
	('RO', 'Romania', 46, 25),
	('RU', 'Russian Federation', 60, 100),
	('RW', 'Rwanda', -2, 30),
	('BL', 'Saint Barthelemy', 17.8979, -62.8505),
	('SH', 'Saint Helena', -15.9333, -5.7),
	('KN', 'Saint Kitts and Nevis', 17.3333, -62.75),
	('LC', 'Saint Lucia', 13.8833, -61.1333),
	('MF', 'Saint Martin', 18.0731, -63.0822),
	('PM', 'Saint Pierre and Miquelon', 46.8333, -56.3333),
	('VC', 'Saint Vincent and the Grenadines', 13.25, -61.2),
	('WS', 'Samoa', -13.5833, -172.333),
	('SM', 'San Marino', 43.7667, 12.4167),
	('ST', 'Sao Tome and Principe', 1, 7),
	('SA', 'Saudi Arabia', 25, 45),
	('SN', 'Senegal', 14, -14),
	('RS', 'Serbia', 44, 21),
	('SC', 'Seychelles', -4.5833, 55.6667),
	('SL', 'Sierra Leone', 8.5, -11.5),
	('SG', 'Singapore', 1.3667, 103.8),
	('SX', 'Sint Maarten', 18.0167, 63.05),
	('SK', 'Slovakia (Slovak Republic)', 48.6667, 19.5),
	('SI', 'Slovenia', 46, 15),
	('SB', 'Solomon Islands', -8, 159),
	('SO', 'Somalia', 10, 49),
	('ZA', 'South Africa', -29, 24),
	('GS', 'South Georgia and the South Sandwich Islands', -54.5, -37),
	('SS', 'South Sudan', 4.85, 31.6),
	('ES', 'Spain', 40, -4),
	('LK', 'Sri Lanka', 7, 81),
	('SD', 'Sudan', 15, 30),
	('SR', 'Suriname', 4, -56),
	('SJ', 'Svalbard and Jan Mayen', 78, 20),
	('SZ', 'Swaziland', -26.5, 31.5),
	('SE', 'Sweden', 62, 15),
	('CH', 'Switzerland', 47, 8),
	('SY', 'Syria', 35, 38),
	('TW', 'Taiwan', 23.5, 121),
	('TJ', 'Tajikistan', 39, 71),
	('TZ', 'Tanzania', -6, 35),
	('TH', 'Thailand', 15, 100),
	('TL', 'Timor-Leste', -8.5666, 125.567),
	('TG', 'Togo', 8, 1.1667),
	('TK', 'Tokelau', -9, -172),
	('TO', 'Tonga', -20, -175),
	('TT', 'Trinidad and Tobago', 11, -61),
	('TN', 'Tunisia', 34, 9),
	('TR', 'Turkey', 39, 35),
	('TM', 'Turkmenistan', 40, 60),
	('TC', 'Turks and Caicos Islands', 21.75, -71.5833),
	('TV', 'Tuvalu', -8, 178),
	('UG', 'Uganda', 1, 32),
	('UA', 'Ukraine', 49, 32),
	('AE', 'United Arab Emirates', 24, 54),
	('GB', 'United Kingdom', 54, -2),
	('US', 'United States of America', 38, -97),
	('UM', 'United States Minor Outlying Islands', 19.2833, 166.6),
	('UY', 'Uruguay', -33, -56),
	('UZ', 'Uzbekistan', 41, 64),
	('VU', 'Vanuatu', -16, 167),
	('VE', 'Venezuela', 8, -66),
	('VN', 'Vietnam', 16, 106),
	('VG', 'British Virgin Islands', 18.5, -64.5),
	('VI', 'United States Virgin Islands', 18.3333, -64.8333),
	('WF', 'Wallis and Futuna', -13.3, -176.2),
	('EH', 'Western Sahara', 24.5, -13),
	('XK', 'Kosovo', 42.67, 21.17),
	('YE', 'Yemen', 15, 48),
	('ZM', 'Zambia', -15, 30),
	('ZW', 'Zimbabwe', -20, 30);";

	return $str;
}
