import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

import StatusLabel from "features/common/components/status-label";
import Button from "features/common/components/button";
import { useWalletIsSignedInQuery } from "features/common/hooks/useWalletQueries";

import { utils } from "near-api-js";

import type { Issue } from "../types";
import { viewFunction, callFunction } from "features/near/api";

export default function IssueDetailsSidebar(props: { issue: Issue }) {
  const router = useRouter();
  const walletIsSignedInQuery = useWalletIsSignedInQuery();

  const [bounty, setBounty] = useState(null);
  const [pool, setPool] = useState("");
  const [poolInDollars, setPoolInDollars] = useState<string>("");

  /* A hook that is called when the component is mounted. 
  In order to fetch the bounty stored in the contract
 */
  useEffect(() => {
    if (!props.issue) return;
    viewFunction("getBountyByIssue", { issueId: props.issue.number })
      .then((res) => {
        setBounty(res);
        setPool(utils.format.formatNearAmount(res?.pool));
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  

  
  useEffect(() => {
    /* This is a function that is called when a bounty is found. It fetches the current price of
    NEAR from the CoinGecko API and then calculates the value of the bounty pool in USD. */
    (async () => {
      if (!bounty) return;
      const apiData = await fetch(
        "https://api.coingecko.com/api/v3/coins/near"
      );
      const nearData = await apiData.json();

      setPoolInDollars(
        (nearData?.market_data?.current_price?.usd * parseFloat(pool)).toFixed(
          2
        )
      );
    })();
  }, [bounty , pool]);

  return (
    <aside>
      <SidebarItem title="Status" content={<StatusLabel status="open" />} />
      <SidebarItem
        title="Total bounty sum"
        content={
          <div>
            {!bounty
              ? "-"
              : pool + " Near"}{" "}
            - ${poolInDollars}
          </div>
        }
      />
      <SidebarItem
        title="Funders"
        content={
          <div className="flex gap-2 flex-wrap">
            {!bounty
              ? "-"
              : bounty.funders.map((funder: string) => {
                  return <span key={funder}>{funder}</span>;
                })}
          </div>
        }
      />
      <div className="flex flex-col gap-y-4 justify-center pt-4">
        <Button
          onClick={() =>
            router.push(`/issues/${props.issue.number}/add-bounty`)
          }
          disabled={!walletIsSignedInQuery.data}
        >
          Add Bounty
        </Button>

        <Button
          onClick={() =>
            /* Calling the startWork function in the contract. */
            callFunction("startWork", { issueId: props.issue.number })
              .then(() => {
                alert("Successfully started working on the bounty");
              })
              .catch((error) => {
                alert(error);
              })
          }
          disabled={!bounty || !walletIsSignedInQuery.data}
        >
          Start Work
        </Button>
      </div>
      {!walletIsSignedInQuery.data && (
        <p className="text-xs text-center mt-2 text-gray-500 dark:text-zinc-500">
          You need to connect a wallet to add a bounty.
        </p>
      )}
    </aside>
  );
}

function SidebarItem(props: { title: string; content: React.ReactNode }) {
  return (
    <div className="py-4 border-b-2 border-gray-100 dark:border-zinc-800">
      <div className="mb-1 font-semibold">{props.title}:</div>
      {props.content}
    </div>
  );
}
