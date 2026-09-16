import type { RedTeamType, TaskAgentType } from '@/lib/simulation/types';

export function AgentDuel({
  taskAgentType,
  redTeamType,
}: {
  taskAgentType: TaskAgentType;
  redTeamType: RedTeamType;
}) {
  return (
    <section className="arena-ui-scene fade-in">
      {/* Grid lines background */}
      <div className="arena-ui-scene-grid" />

      {/* Ambient center glow */}
      <div className="arena-ui-scene-orb" />

      {/* Floating accent dots */}
      <div className="arena-ui-scene-particles">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`arena-ui-particle p-${i}`} />
        ))}
      </div>

      {/* Rotating orbit rings */}
      <div className="arena-ui-shield-ring ring-1" />
      <div className="arena-ui-shield-ring ring-2" />

      {/* Defender avatar */}
      <div className="arena-ui-agent-card is-task">
        <span>🤖</span>
        <strong title={taskAgentType}>Defender</strong>
      </div>

      {/* Browser viewport mockup */}
      <div className="arena-ui-viewport-node">
        <div className="arena-ui-viewport-head">
          <span />
          <span />
          <span />
          <p>live-viewport</p>
        </div>
        <div className="arena-ui-viewport-body">
          <div className="arena-ui-screen-line" />
          <div className="arena-ui-screen-line" />
          <div className="arena-ui-screen-line short" />
          <div className="arena-ui-screen-blocks">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      {/* Attacker avatar */}
      <div className="arena-ui-agent-card is-red">
        <span>🎭</span>
        <strong title={redTeamType}>Attacker</strong>
      </div>

      {/* Threat fish swarm */}
      <div className="arena-ui-fish-school">
        <span className="arena-ui-fish fish-magenta" />
        <span className="arena-ui-fish fish-cyan" />
        <span className="arena-ui-fish fish-orange" />
        <span className="arena-ui-fish fish-red" />
        <span className="arena-ui-fish fish-yellow" />
      </div>
    </section>
  );
}
