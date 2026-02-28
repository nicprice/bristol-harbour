export type PositionSource = 'TIMETABLE' | 'GPS';
export type VesselStatus = 'Scheduled' | 'Estimated' | 'Live' | 'Actual Position';
export type VesselType = 'PassengerFerry' | 'Workboat';

export interface Coordinates {
    lat: number;
    lon: number;
}

export interface Stop {
    id: string;
    name: string;
    coords: Coordinates; // Water coordinate for routing
    landCoords?: Coordinates; // Land coordinate for marker rendering
}

export interface StopTime {
    stopId: string;
    arrivalTime: string; // ISO 8601 string
    departureTime: string; // ISO 8601 string
}

export interface Vessel {
    id: string;
    name: string;
    type: VesselType;
    positionSource: PositionSource;
    color?: string; // Hex color
    textInitial: string;
    avatarUrl?: string; // Cartoon image url
    schedule?: StopTime[]; // Used if positionSource === 'TIMETABLE'
    currentCoords?: Coordinates; // Updated live or via interpolation
    status?: VesselStatus;
    lastUpdated?: string;
    nextStopId?: string;
    nextArrivalTime?: string;
}

export interface Route {
    id: string;
    name: string;
    stops: Stop[];
    path: Coordinates[]; // For drawing the polyline
}

// Data: Updated to dynamically generate times so ferries are always active

// Bristol Harbour accurate water coordinates
export const stops: Stop[] = [
    { id: 'temple-meads', name: 'Temple Meads', coords: { lat: 51.4515123, lon: -2.5812173 } },
    { id: 'castle-park', name: 'Castle Park', coords: { lat: 51.4549873, lon: -2.5887009 } },
    { id: 'city-centre', name: 'City Centre', coords: { lat: 51.4520327, lon: -2.597747 } },
    { id: 'wapping-wharf', name: 'Wapping Wharf', coords: { lat: 51.4475188, lon: -2.6016256 }, landCoords: { lat: 51.447470, lon: -2.601550 } },
    { id: 'ss-great-britain', name: 'ss Great Britain', coords: { lat: 51.4490229, lon: -2.6070286 } },
    { id: 'mardyke', name: 'Mardyke', coords: { lat: 51.4491382, lon: -2.613091 } },
    { id: 'hotwells', name: 'Hotwells', coords: { lat: 51.4471483, lon: -2.6158254 } },
];

export const routePath: Coordinates[] = [
    { lat: 51.4515123, lon: -2.5812173 }, // node 507004139
    { lat: 51.4515617, lon: -2.5811997 }, // node 12951701009
    { lat: 51.451631, lon: -2.581217 }, // node 12951701010
    { lat: 51.4516863, lon: -2.5812624 }, // node 12951701011
    { lat: 51.4517283, lon: -2.5813284 }, // node 507004159
    { lat: 51.4521979, lon: -2.5825564 }, // node 12951701012
    { lat: 51.4526703, lon: -2.5839593 }, // node 4296454869
    { lat: 51.4531901, lon: -2.5853322 }, // node 430692997
    { lat: 51.4535473, lon: -2.5862154 }, // node 12951701013
    { lat: 51.4538, lon: -2.5865842 }, // node 430692995
    { lat: 51.4541102, lon: -2.5870134 }, // node 430692994
    { lat: 51.4543937, lon: -2.5873481 }, // node 430692993
    { lat: 51.4546451, lon: -2.5877859 }, // node 430692992
    { lat: 51.4547606, lon: -2.5882233 }, // node 430692991
    { lat: 51.4547839, lon: -2.5884579 }, // node 12951701014
    { lat: 51.4548536, lon: -2.5886072 }, // node 12951701015
    { lat: 51.454936, lon: -2.5886755 }, // node 12951701016
    { lat: 51.4549873, lon: -2.5887009 }, // node 430692989
    { lat: 51.4549529, lon: -2.5887041 }, // node 12951701019
    { lat: 51.4548699, lon: -2.588757 }, // node 12951701018
    { lat: 51.4548015, lon: -2.5889079 }, // node 12951701017
    { lat: 51.4547813, lon: -2.5890916 }, // node 430692988
    { lat: 51.4547098, lon: -2.5894271 }, // node 12951701020
    { lat: 51.4546076, lon: -2.5896827 }, // node 430692987
    { lat: 51.4541958, lon: -2.5904638 }, // node 430692986
    { lat: 51.4538321, lon: -2.5910045 }, // node 430692985
    { lat: 51.4535433, lon: -2.5914165 }, // node 430692984
    { lat: 51.4532491, lon: -2.5916912 }, // node 430692983
    { lat: 51.4528908, lon: -2.59188 }, // node 430692982
    { lat: 51.4525618, lon: -2.5919698 }, // node 12951701022
    { lat: 51.4519616, lon: -2.5920512 }, // node 430692979
    { lat: 51.451559, lon: -2.5920173 }, // node 430692978
    { lat: 51.450885, lon: -2.5919487 }, // node 430692977
    { lat: 51.4502806, lon: -2.5919487 }, // node 430692976
    { lat: 51.4498333, lon: -2.5919486 }, // node 430692974
    { lat: 51.4496056, lon: -2.5920396 }, // node 2692245546
    { lat: 51.4493685, lon: -2.5921908 }, // node 430692973
    { lat: 51.4491321, lon: -2.5923496 }, // node 430692972
    { lat: 51.4489438, lon: -2.5926412 }, // node 2692245571
    { lat: 51.4487986, lon: -2.5930147 }, // node 5834880337
    { lat: 51.4486605, lon: -2.5937291 }, // node 2692245575
    { lat: 51.4485734, lon: -2.5944813 }, // node 430692970
    { lat: 51.4485984, lon: -2.5964715 }, // node 973129635
    { lat: 51.4485717, lon: -2.5969129 }, // node 17399141
    { lat: 51.4485697, lon: -2.5978331 }, // node 10135259544
    { lat: 51.4486052, lon: -2.5980108 }, // node 10135259543
    { lat: 51.4486857, lon: -2.5981454 }, // node 12951701045
    { lat: 51.4487468, lon: -2.5981974 }, // node 10135259542
    { lat: 51.448836, lon: -2.5981989 }, // node 12951701042
    { lat: 51.4502239, lon: -2.5979518 }, // node 13234345197
    { lat: 51.4509143, lon: -2.5976536 }, // node 12951701048
    { lat: 51.4515204, lon: -2.5975985 }, // node 12951701047
    { lat: 51.4517996, lon: -2.5976974 }, // node 12951701046
    { lat: 51.4520327, lon: -2.597747 }, // node 286872267
    { lat: 51.451911, lon: -2.597759 }, // node 12951701051
    { lat: 51.4517956, lon: -2.5977623 }, // node 12951701050
    { lat: 51.4515171, lon: -2.5976638 }, // node 286872149
    { lat: 51.4509188, lon: -2.5977182 }, // node 6293338327
    { lat: 51.4502309, lon: -2.5980067 }, // node 13234345198
    { lat: 51.4484079, lon: -2.5983449 }, // node 286872269
    { lat: 51.4481213, lon: -2.5987317 }, // node 12951701029
    { lat: 51.4479455, lon: -2.5990883 }, // node 12951701028
    { lat: 51.4475657, lon: -2.6001221 }, // node 12951701027
    { lat: 51.4474728, lon: -2.6008459 }, // node 12951701026
    { lat: 51.4474836, lon: -2.6012706 }, // node 12951701025
    { lat: 51.4475015, lon: -2.6014411 }, // node 12951701023
    { lat: 51.4475188, lon: -2.6016256 }, // node 12951701043
    { lat: 51.4474838, lon: -2.6018036 }, // node 12951701044
    { lat: 51.4474038, lon: -2.6019388 }, // node 12951701049
    { lat: 51.447297, lon: -2.6020316 }, // node 12951701024
    { lat: 51.4473519, lon: -2.6020079 }, // node 12951701032
    { lat: 51.4474669, lon: -2.6020357 }, // node 12951701031
    { lat: 51.4475626, lon: -2.6021417 }, // node 12951701030
    { lat: 51.4476196, lon: -2.6023044 }, // node 12951701041
    { lat: 51.4477397, lon: -2.6029399 }, // node 12951701040
    { lat: 51.448184, lon: -2.6047497 }, // node 12951701039
    { lat: 51.4483325, lon: -2.6051372 }, // node 12951701038
    { lat: 51.4486654, lon: -2.6058541 }, // node 12951701037
    { lat: 51.4490757, lon: -2.6065937 }, // node 12951701036
    { lat: 51.4491145, lon: -2.6067096 }, // node 12951701035
    { lat: 51.4491172, lon: -2.6068228 }, // node 12951701034
    { lat: 51.4490875, lon: -2.6069305 }, // node 12951701033
    { lat: 51.4490229, lon: -2.6070286 }, // node 507033104
    { lat: 51.4490913, lon: -2.6069618 }, // node 12951701069
    { lat: 51.4492054, lon: -2.6069258 }, // node 12951701070
    { lat: 51.4493177, lon: -2.6069739 }, // node 12951701077
    { lat: 51.4494055, lon: -2.6070962 }, // node 12951701076
    { lat: 51.4495531, lon: -2.6075302 }, // node 12951701074
    { lat: 51.4497384, lon: -2.6083121 }, // node 12951701073
    { lat: 51.449812, lon: -2.608836 }, // node 286871626
    { lat: 51.4498085, lon: -2.6094454 }, // node 12951701071
    { lat: 51.4496934, lon: -2.6102563 }, // node 5834880346
    { lat: 51.4494753, lon: -2.611228 }, // node 12951701072
    { lat: 51.4490898, lon: -2.6125482 }, // node 12951701078
    { lat: 51.4490556, lon: -2.6127265 }, // node 12951701079
    { lat: 51.4490737, lon: -2.6129108 }, // node 12951701080
    { lat: 51.4491382, lon: -2.613091 }, // node 289540346
    { lat: 51.449024, lon: -2.6130638 }, // node 12951701081
    { lat: 51.4489196, lon: -2.6131458 }, // node 12951701085
    { lat: 51.4488482, lon: -2.613293 }, // node 12951701084
    { lat: 51.4480748, lon: -2.6154301 }, // node 12951701083
    { lat: 51.4478991, lon: -2.6157395 }, // node 286871368
    { lat: 51.4476647, lon: -2.6159233 }, // node 12951701082
    { lat: 51.4474047, lon: -2.6159558 }, // node 12951701086
    { lat: 51.4471483, lon: -2.6158254 }, // node 289536431
];


export const bristolFerriesRoute: Route = {
    id: 'bristol-ferries-main',
    name: 'Bristol Ferries Main Route',
    stops: stops,
    path: routePath
};

function generateDynamicSchedule(stopIds: string[], offsetsFromStartMinutes: number[], dockDurationsMinutes: number[], startOffsetFromNowMinutes: number): StopTime[] {
    const now = Date.now();
    const startTimeMs = now + startOffsetFromNowMinutes * 60000;
    return stopIds.map((stopId, i) => {
        const arrivalTimeMs = startTimeMs + offsetsFromStartMinutes[i] * 60000;
        const departureTimeMs = arrivalTimeMs + dockDurationsMinutes[i] * 60000;
        return {
            stopId,
            arrivalTime: new Date(arrivalTimeMs).toISOString(),
            departureTime: new Date(departureTimeMs).toISOString()
        };
    });
}

export const mockVessels: Vessel[] = [
    {
        id: 'ferry-1',
        name: 'Matilda',
        type: 'PassengerFerry',
        positionSource: 'TIMETABLE',
        color: '#fada5e', // yellow
        textInitial: 'M',
        avatarUrl: 'assets/matilda.png',
        schedule: generateDynamicSchedule(
            ['temple-meads', 'castle-park', 'city-centre', 'wapping-wharf', 'ss-great-britain', 'mardyke', 'hotwells'],
            [0, 10, 20, 27, 34, 42, 50],
            [5, 2, 3, 2, 2, 2, 5],
            -20 // Start 20 mins ago
        )
    },
    {
        id: 'ferry-2',
        name: 'Brigantia',
        type: 'PassengerFerry',
        positionSource: 'TIMETABLE',
        color: '#005b96', // blue
        textInitial: 'B',
        avatarUrl: 'assets/brigantia.png',
        schedule: generateDynamicSchedule(
            ['hotwells', 'mardyke', 'ss-great-britain', 'wapping-wharf', 'city-centre', 'castle-park', 'temple-meads'],
            [0, 16, 22, 28, 35, 42, 48],
            [5, 2, 2, 2, 3, 2, 5],
            -15 // Start 15 mins ago
        )
    }
];
