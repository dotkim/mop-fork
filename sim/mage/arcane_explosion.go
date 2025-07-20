package mage

import (
	"github.com/wowsims/mop/sim/core"
)

func (mage *Mage) registerArcaneExplosionSpell() {

	arcaneExplosionVariance := 0.08
	arcaneExplosionCoefficient := 0.55
	arcaneExplosionScaling := 0.483

	mage.RegisterSpell(core.SpellConfig{
		ActionID:       core.ActionID{SpellID: 1449},
		SpellSchool:    core.SpellSchoolArcane,
		ProcMask:       core.ProcMaskSpellDamage,
		Flags:          core.SpellFlagAoE | core.SpellFlagAPL,
		ClassSpellMask: MageSpellArcaneExplosion,

		ManaCost: core.ManaCostOptions{
			BaseCostPercent: 3,
		},
		Cast: core.CastConfig{
			DefaultCast: core.Cast{
				GCD: core.GCDDefault,
			},
		},

		DamageMultiplier: 1,
		CritMultiplier:   mage.DefaultCritMultiplier(),
		BonusCoefficient: arcaneExplosionCoefficient,
		ThreatMultiplier: 1,

		ApplyEffects: func(sim *core.Simulation, target *core.Unit, spell *core.Spell) {
			baseDamage := mage.CalcAndRollDamageRange(sim, arcaneExplosionScaling, arcaneExplosionVariance)
			spell.CalcAndDealAoeDamage(sim, baseDamage, spell.OutcomeMagicHitAndCrit)
		},
	})
}
