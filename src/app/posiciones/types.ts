export type SerializedMatch = {
	id: string;
	matchNumber: number;
	homeTeam: string | null;
	awayTeam: string | null;
	homeLabel?: string | null;
	awayLabel?: string | null;
	homeGoals: number | null;
	awayGoals: number | null;
	date: string;
	venue: string;
	group: string | null;
	stage: string;
	status: string;
};
