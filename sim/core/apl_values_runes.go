package core

import (
	"fmt"
	"time"

	"github.com/wowsims/mop/sim/core/proto"
	"github.com/wowsims/mop/sim/core/stats"
)

type APLValueCurrentRuneCount struct {
	DefaultAPLValueImpl
	unit     *Unit
	runeType proto.APLValueRuneType
}

func (rot *APLRotation) newValueCurrentRuneCount(config *proto.APLValueCurrentRuneCount, uuid *proto.UUID) APLValue {
	unit := rot.unit
	if !unit.HasRunicPowerBar() {
		rot.ValidationMessageByUUID(uuid, proto.LogLevel_Warning, "%s does not use Runes", unit.Label)
		return nil
	}
	return &APLValueCurrentRuneCount{
		unit:     unit,
		runeType: config.RuneType,
	}
}
func (value *APLValueCurrentRuneCount) Type() proto.APLValueType {
	return proto.APLValueType_ValueTypeInt
}
func (value *APLValueCurrentRuneCount) GetInt(_ *Simulation) int32 {
	switch value.runeType {
	case proto.APLValueRuneType_RuneBlood:
		return int32(value.unit.CurrentBloodOrDeathRunes())
	case proto.APLValueRuneType_RuneFrost:
		return int32(value.unit.CurrentFrostOrDeathRunes())
	case proto.APLValueRuneType_RuneUnholy:
		return int32(value.unit.CurrentUnholyOrDeathRunes())
	case proto.APLValueRuneType_RuneDeath:
		return int32(value.unit.CurrentDeathRunes())
	}
	return 0
}
func (value *APLValueCurrentRuneCount) String() string {
	return fmt.Sprintf("Current Rune Count(%s)", value.runeType)
}

type APLValueCurrentNonDeathRuneCount struct {
	DefaultAPLValueImpl
	unit     *Unit
	runeType proto.APLValueRuneType
}

func (rot *APLRotation) newValueCurrentNonDeathRuneCount(config *proto.APLValueCurrentNonDeathRuneCount, uuid *proto.UUID) APLValue {
	unit := rot.unit
	if !unit.HasRunicPowerBar() {
		rot.ValidationMessageByUUID(uuid, proto.LogLevel_Warning, "%s does not use Runes", unit.Label)
		return nil
	}
	return &APLValueCurrentNonDeathRuneCount{
		unit:     unit,
		runeType: config.RuneType,
	}
}
func (value *APLValueCurrentNonDeathRuneCount) Type() proto.APLValueType {
	return proto.APLValueType_ValueTypeInt
}
func (value *APLValueCurrentNonDeathRuneCount) GetInt(_ *Simulation) int32 {
	switch value.runeType {
	case proto.APLValueRuneType_RuneBlood:
		return int32(value.unit.CurrentBloodRunes())
	case proto.APLValueRuneType_RuneFrost:
		return int32(value.unit.CurrentFrostRunes())
	case proto.APLValueRuneType_RuneUnholy:
		return int32(value.unit.CurrentUnholyRunes())
	}
	return 0
}
func (value *APLValueCurrentNonDeathRuneCount) String() string {
	return fmt.Sprintf("Current Non-Death Rune Count(%s)", value.runeType)
}

type APLValueCurrentRuneActive struct {
	DefaultAPLValueImpl
	unit     *Unit
	runeSlot int8
}

func (rot *APLRotation) newValueCurrentRuneActive(config *proto.APLValueCurrentRuneActive, uuid *proto.UUID) APLValue {
	unit := rot.unit
	if !unit.HasRunicPowerBar() {
		rot.ValidationMessageByUUID(uuid, proto.LogLevel_Warning, "%s does not use Runes", unit.Label)
		return nil
	}
	return &APLValueCurrentRuneActive{
		unit:     unit,
		runeSlot: int8(config.RuneSlot) - 1, // 0 is Unknown
	}
}
func (value *APLValueCurrentRuneActive) Type() proto.APLValueType {
	return proto.APLValueType_ValueTypeBool
}
func (value *APLValueCurrentRuneActive) GetBool(_ *Simulation) bool {
	return value.unit.RuneIsActive(value.runeSlot)
}
func (value *APLValueCurrentRuneActive) String() string {
	return fmt.Sprintf("Current Rune Active(%d)", value.runeSlot)
}

type APLValueCurrentRuneDeath struct {
	DefaultAPLValueImpl
	unit     *Unit
	runeSlot int8
}

func (rot *APLRotation) newValueCurrentRuneDeath(config *proto.APLValueCurrentRuneDeath, uuid *proto.UUID) APLValue {
	unit := rot.unit
	if !unit.HasRunicPowerBar() {
		rot.ValidationMessageByUUID(uuid, proto.LogLevel_Warning, "%s does not use Runes", unit.Label)
		return nil
	}
	return &APLValueCurrentRuneDeath{
		unit:     unit,
		runeSlot: int8(config.RuneSlot) - 1, // 0 is Unknown
	}
}
func (value *APLValueCurrentRuneDeath) Type() proto.APLValueType {
	return proto.APLValueType_ValueTypeBool
}
func (value *APLValueCurrentRuneDeath) GetBool(_ *Simulation) bool {
	return value.unit.RuneIsDeath(int8(value.runeSlot))
}
func (value *APLValueCurrentRuneDeath) String() string {
	return fmt.Sprintf("Current Rune Death(%d)", value.runeSlot)
}

type APLValueRuneCooldown struct {
	DefaultAPLValueImpl
	unit     *Unit
	runeType proto.APLValueRuneType
}

func (rot *APLRotation) newValueRuneCooldown(config *proto.APLValueRuneCooldown, uuid *proto.UUID) APLValue {
	unit := rot.unit
	if !unit.HasRunicPowerBar() {
		rot.ValidationMessageByUUID(uuid, proto.LogLevel_Warning, "%s does not use Runes", unit.Label)
		return nil
	}
	return &APLValueRuneCooldown{
		unit:     unit,
		runeType: config.RuneType,
	}
}
func (value *APLValueRuneCooldown) Type() proto.APLValueType {
	return proto.APLValueType_ValueTypeDuration
}
func (value *APLValueRuneCooldown) GetDuration(sim *Simulation) time.Duration {
	returnValue := time.Duration(0)
	switch value.runeType {
	case proto.APLValueRuneType_RuneBlood:
		returnValue = value.unit.BloodRuneReadyAt(sim) - sim.CurrentTime
	case proto.APLValueRuneType_RuneFrost:
		returnValue = value.unit.FrostRuneReadyAt(sim) - sim.CurrentTime
	case proto.APLValueRuneType_RuneUnholy:
		returnValue = value.unit.UnholyRuneReadyAt(sim) - sim.CurrentTime
	}
	return max(0, returnValue)
}
func (value *APLValueRuneCooldown) String() string {
	return fmt.Sprintf("Rune Cooldown(%s)", value.runeType)
}

type APLValueNextRuneCooldown struct {
	DefaultAPLValueImpl
	unit     *Unit
	runeType proto.APLValueRuneType
}

func (rot *APLRotation) newValueNextRuneCooldown(config *proto.APLValueNextRuneCooldown, uuid *proto.UUID) APLValue {
	unit := rot.unit
	if !unit.HasRunicPowerBar() {
		rot.ValidationMessageByUUID(uuid, proto.LogLevel_Warning, "%s does not use Runes", unit.Label)
		return nil
	}
	return &APLValueNextRuneCooldown{
		unit:     unit,
		runeType: config.RuneType,
	}
}
func (value *APLValueNextRuneCooldown) Type() proto.APLValueType {
	return proto.APLValueType_ValueTypeDuration
}
func (value *APLValueNextRuneCooldown) GetDuration(sim *Simulation) time.Duration {
	returnValue := time.Duration(0)
	switch value.runeType {
	case proto.APLValueRuneType_RuneBlood:
		returnValue = value.unit.NextBloodRuneReadyAt(sim) - sim.CurrentTime
	case proto.APLValueRuneType_RuneFrost:
		returnValue = value.unit.NextFrostRuneReadyAt(sim) - sim.CurrentTime
	case proto.APLValueRuneType_RuneUnholy:
		returnValue = value.unit.NextUnholyRuneReadyAt(sim) - sim.CurrentTime
	}
	return max(0, returnValue)
}
func (value *APLValueNextRuneCooldown) String() string {
	return fmt.Sprintf("Next Rune Cooldown(%s)", value.runeType)
}

type APLValueRuneSlotCooldown struct {
	DefaultAPLValueImpl
	unit     *Unit
	runeSlot int8
}

func (rot *APLRotation) newValueRuneSlotCooldown(config *proto.APLValueRuneSlotCooldown, uuid *proto.UUID) APLValue {
	unit := rot.unit
	if !unit.HasRunicPowerBar() {
		rot.ValidationMessageByUUID(uuid, proto.LogLevel_Warning, "%s does not use Runes", unit.Label)
		return nil
	}
	return &APLValueRuneSlotCooldown{
		unit:     unit,
		runeSlot: int8(config.RuneSlot) - 1, // 0 is Unknown
	}
}
func (value *APLValueRuneSlotCooldown) Type() proto.APLValueType {
	return proto.APLValueType_ValueTypeDuration
}
func (value *APLValueRuneSlotCooldown) GetDuration(sim *Simulation) time.Duration {
	return max(0, value.unit.RuneReadyAt(sim, value.runeSlot)-sim.CurrentTime)
}
func (value *APLValueRuneSlotCooldown) String() string {
	return fmt.Sprintf("Rune Slot Cooldown(%d)", value.runeSlot)
}

type APLValueFullRuneCooldown struct {
	DefaultAPLValueImpl
	unit         *Unit
	useBaseValue bool
}

func (rot *APLRotation) newValueFullRuneCooldown(config *proto.APLValueFullRuneCooldown, uuid *proto.UUID) APLValue {
	unit := rot.unit
	if !unit.HasRunicPowerBar() {
		rot.ValidationMessageByUUID(uuid, proto.LogLevel_Warning, "%s does not use Runes", unit.Label)
		return nil
	}
	return &APLValueFullRuneCooldown{
		unit:         unit,
		useBaseValue: config.UseBaseValue,
	}
}
func (value *APLValueFullRuneCooldown) Type() proto.APLValueType {
	return proto.APLValueType_ValueTypeDuration
}
func (value *APLValueFullRuneCooldown) GetDuration(sim *Simulation) time.Duration {
	if value.useBaseValue {
		//initialHaste := value.unit.PseudoStats.AttackSpeedMultiplier * value.unit.PseudoStats.MeleeSpeedMultiplier
		initialHaste := (1 + (value.unit.GetInitialStat(stats.HasteRating) / (HasteRatingPerHastePercent * 100)))
		return DurationFromSeconds(value.unit.runeCD.Seconds() / initialHaste)
	} else {
		return DurationFromSeconds(value.unit.runeCD.Seconds() * value.unit.runicPowerBar.getTotalRegenMultiplier())
	}
}
func (value *APLValueFullRuneCooldown) String() string {
	return "Full Rune Cooldown"
}
