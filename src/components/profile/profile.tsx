"use client";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Match from "./match";
import { MatchHistory } from "@/types/MatchHistory";
import { LeaderboardTypeValues } from "@/types/LeaderBoard";
import { SteamProfile } from "@/types/Steam";
import Image from "next/image";
import StatCard from "./statCard";
import { ILeaderboardPlayer } from "@/types/LeaderboardPlayer";

export default function Profile() {
  const [matchHistoryStats, setMatchHistoryStats] = useState<
    MatchHistory["mappedMatchHistoryData"]
  >([]);
  const [playerStats, setPlayerStats] = useState<ILeaderboardPlayer[]>([]);
  const [playerName, setPlayerName] = useState<string>("");
  const [steamProfile, setSteamProfile] = useState<SteamProfile>();
  const [leaderboardId, setLeaderboardId] = useState<number>(
    LeaderboardTypeValues["1v1Supremacy"]
  );
  const params = useParams();
  const { id } = params;
  const playerId = String(id);

  const { status } = useSession(); // get the client session status

  const fetchProfileData = async (playerId: string) => {
    const baseUrl = "/api/matchHistory";
    const params = new URLSearchParams({
      playerId,
    });
    const url = `${baseUrl}?${params.toString()}`;

    try {
      const response = await fetch(url);
      const data: MatchHistory = await response.json();
      setMatchHistoryStats(data.mappedMatchHistoryData);
      setPlayerName(data.playerName);
    } catch (error: any) {
      console.error("Error fetching profile data:", error);
      setMatchHistoryStats([]);
    }
  };

  const fetchPlayerStats = async (playerId: string) => {
    const baseUrl = `/api/leaderboards/[${playerId}]`;
    const params = new URLSearchParams({
      leaderboardId: leaderboardId.toString(),
      playerId,
    });
    const url = `${baseUrl}?${params.toString()}`;
    const response = await fetch(url);
    const data: ILeaderboardPlayer[] = await response.json();
    setPlayerStats(data);
    if (data.length > 0) {
      const steamId = data[0].profileUrl.split("/").pop();
      if (steamId) {
        fetchSteamProfile(steamId);
      }
    }
  };

  const fetchSteamProfile = async (steamId: string) => {
    const url = `/api/steam/${steamId}`;
    const response = await fetch(url);
    const data: SteamProfile = await response.json();
    setSteamProfile(data);
  };

  useEffect(() => {
    fetchProfileData(playerId);
    fetchPlayerStats(playerId);
  }, [playerId]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center w-full">
        <Skeleton className="w-full h-16 rounded-full" />{" "}
      </div>
    );
  }

  return (
    <div className="w-full text-2xl">
      <CardHeader className="w-full text-center">
        {steamProfile && (
          <Image
            src={steamProfile.avatarfull}
            alt="Profile Picture"
            width={84}
            height={84}
            className="rounded-full mx-auto"
          />
        )}
      </CardHeader>
      <div className="w-full flex flex-col items-center">
        <h1 className="text-4xl font-semibold text-gold">{playerName}</h1>
        <div className="w-full my-4">
          {playerStats &&
            playerStats.map((stat) => (
              <div key={Number(stat.leaderboard_id)} className="w-full">
                <StatCard playerStats={stat} />
              </div>
            ))}
        </div>
      </div>

      <Card className="w-full">
        {matchHistoryStats.map((match) => (
          <Match key={match.matchId} match={match} />
        ))}
      </Card>
    </div>
  );
}
