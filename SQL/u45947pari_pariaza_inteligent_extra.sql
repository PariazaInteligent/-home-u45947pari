
--
-- Indexuri pentru tabele eliminate
--

--
-- Indexuri pentru tabele `bet_allocations`
--
ALTER TABLE `bet_allocations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_alloc` (`bet_group_id`,`user_id`);

--
-- Indexuri pentru tabele `bet_groups`
--
ALTER TABLE `bet_groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `group_uid` (`group_uid`);

--
-- Indexuri pentru tabele `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_chat_client_id` (`client_id`),
  ADD KEY `ix_chat_created` (`created_at`),
  ADD KEY `ix_chat_id` (`id`),
  ADD KEY `idx_client_id` (`client_id`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_user_name` (`user_name`),
  ADD KEY `idx_chat_reply_to` (`reply_to`);
ALTER TABLE `chat_messages` ADD FULLTEXT KEY `ft_body_user` (`body`,`user_name`);

--
-- Indexuri pentru tabele `chat_message_edits`
--
ALTER TABLE `chat_message_edits`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `edited_at_idx` (`edited_at`);

--
-- Indexuri pentru tabele `chat_notifications`
--
ALTER TABLE `chat_notifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_msg_kind` (`user_id`,`message_id`,`kind`),
  ADD KEY `idx_user_unread` (`user_id`,`read_at`,`id`),
  ADD KEY `idx_msg_kind` (`message_id`,`kind`);

--
-- Indexuri pentru tabele `chat_presence`
--
ALTER TABLE `chat_presence`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `idx_seen` (`last_seen`),
  ADD KEY `idx_room` (`room`,`last_seen`);

--
-- Indexuri pentru tabele `chat_reactions`
--
ALTER TABLE `chat_reactions`
  ADD PRIMARY KEY (`message_id`,`user_id`,`emoji`),
  ADD KEY `idx_msg` (`message_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexuri pentru tabele `chat_reaction_events`
--
ALTER TABLE `chat_reaction_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_msg` (`message_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexuri pentru tabele `chat_typing`
--
ALTER TABLE `chat_typing`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `idx_until` (`until_ts`),
  ADD KEY `idx_room` (`room`,`until_ts`);

--
-- Indexuri pentru tabele `daily_history`
--
ALTER TABLE `daily_history`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_day` (`day`);

--
-- Indexuri pentru tabele `email_verifications`
--
ALTER TABLE `email_verifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_token` (`token_hash`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexuri pentru tabele `investments`
--
ALTER TABLE `investments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_pi` (`stripe_payment_intent_id`),
  ADD UNIQUE KEY `uniq_cs` (`stripe_checkout_session_id`),
  ADD UNIQUE KEY `uniq_stripe_session` (`stripe_checkout_session_id`),
  ADD UNIQUE KEY `uniq_stripe_pi` (`stripe_payment_intent_id`),
  ADD UNIQUE KEY `uniq_stripe_sid` (`stripe_checkout_session_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_inv_user_status_time` (`user_id`,`status`,`created_at`);

--
-- Indexuri pentru tabele `ledger_tx`
--
ALTER TABLE `ledger_tx`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_created` (`user_id`,`created_at`);

--
-- Indexuri pentru tabele `mfa_pending`
--
ALTER TABLE `mfa_pending`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_ticket` (`ticket`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexuri pentru tabele `opening_balance_cents`
--
ALTER TABLE `opening_balance_cents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_period` (`user_id`,`period_start`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexuri pentru tabele `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_token` (`token_hash`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexuri pentru tabele `payout_profiles`
--
ALTER TABLE `payout_profiles`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexuri pentru tabele `profit_distributions`
--
ALTER TABLE `profit_distributions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_dist` (`bet_group_id`,`user_id`),
  ADD KEY `idx_pd_user_time` (`user_id`,`created_at`);

--
-- Indexuri pentru tabele `rate_limits`
--
ALTER TABLE `rate_limits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_rl` (`action`,`key_hash`,`period_start`);

--
-- Indexuri pentru tabele `remember_tokens`
--
ALTER TABLE `remember_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_selector` (`selector`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Indexuri pentru tabele `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`),
  ADD UNIQUE KEY `user_handle` (`user_handle`);

--
-- Indexuri pentru tabele `user_bet_pins`
--
ALTER TABLE `user_bet_pins`
  ADD PRIMARY KEY (`user_id`,`bet_group_id`),
  ADD KEY `fk_pins_bet` (`bet_group_id`);

--
-- Indexuri pentru tabele `user_daily_balances`
--
ALTER TABLE `user_daily_balances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_user_day` (`user_id`,`day`),
  ADD KEY `idx_day` (`day`);

--
-- Indexuri pentru tabele `user_goals`
--
ALTER TABLE `user_goals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user` (`user_id`);

--
-- Indexuri pentru tabele `withdrawals`
--
ALTER TABLE `withdrawals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexuri pentru tabele `withdrawal_requests`
--
ALTER TABLE `withdrawal_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_user` (`user_id`);

--
-- AUTO_INCREMENT pentru tabele eliminate
--

--
-- AUTO_INCREMENT pentru tabele `bet_allocations`
--
ALTER TABLE `bet_allocations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT pentru tabele `bet_groups`
--
ALTER TABLE `bet_groups`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pentru tabele `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=234;

--
-- AUTO_INCREMENT pentru tabele `chat_notifications`
--
ALTER TABLE `chat_notifications`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT pentru tabele `chat_reaction_events`
--
ALTER TABLE `chat_reaction_events`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pentru tabele `daily_history`
--
ALTER TABLE `daily_history`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pentru tabele `email_verifications`
--
ALTER TABLE `email_verifications`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pentru tabele `investments`
--
ALTER TABLE `investments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pentru tabele `ledger_tx`
--
ALTER TABLE `ledger_tx`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pentru tabele `mfa_pending`
--
ALTER TABLE `mfa_pending`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pentru tabele `opening_balance_cents`
--
ALTER TABLE `opening_balance_cents`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT pentru tabele `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pentru tabele `profit_distributions`
--
ALTER TABLE `profit_distributions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT pentru tabele `rate_limits`
--
ALTER TABLE `rate_limits`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pentru tabele `remember_tokens`
--
ALTER TABLE `remember_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT pentru tabele `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pentru tabele `user_daily_balances`
--
ALTER TABLE `user_daily_balances`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pentru tabele `user_goals`
--
ALTER TABLE `user_goals`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pentru tabele `withdrawals`
--
ALTER TABLE `withdrawals`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pentru tabele `withdrawal_requests`
--
ALTER TABLE `withdrawal_requests`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constrângeri pentru tabele eliminate
--

--
-- Constrângeri pentru tabele `bet_allocations`
--
ALTER TABLE `bet_allocations`
  ADD CONSTRAINT `fk_alloc_group` FOREIGN KEY (`bet_group_id`) REFERENCES `bet_groups` (`id`) ON DELETE CASCADE;

--
-- Constrângeri pentru tabele `email_verifications`
--
ALTER TABLE `email_verifications`
  ADD CONSTRAINT `fk_emailver_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constrângeri pentru tabele `ledger_tx`
--
ALTER TABLE `ledger_tx`
  ADD CONSTRAINT `fk_ledger_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constrângeri pentru tabele `mfa_pending`
--
ALTER TABLE `mfa_pending`
  ADD CONSTRAINT `fk_mfa_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constrângeri pentru tabele `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `fk_pr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constrângeri pentru tabele `payout_profiles`
--
ALTER TABLE `payout_profiles`
  ADD CONSTRAINT `payout_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constrângeri pentru tabele `profit_distributions`
--
ALTER TABLE `profit_distributions`
  ADD CONSTRAINT `fk_dist_group` FOREIGN KEY (`bet_group_id`) REFERENCES `bet_groups` (`id`) ON DELETE CASCADE;

--
-- Constrângeri pentru tabele `remember_tokens`
--
ALTER TABLE `remember_tokens`
  ADD CONSTRAINT `fk_remember_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constrângeri pentru tabele `user_bet_pins`
--
ALTER TABLE `user_bet_pins`
  ADD CONSTRAINT `fk_pins_bet` FOREIGN KEY (`bet_group_id`) REFERENCES `bet_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pins_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constrângeri pentru tabele `user_daily_balances`
--
ALTER TABLE `user_daily_balances`
  ADD CONSTRAINT `fk_daily_bal_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constrângeri pentru tabele `user_goals`
--
ALTER TABLE `user_goals`
  ADD CONSTRAINT `fk_user_goals__users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user_goals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constrângeri pentru tabele `withdrawals`
--
ALTER TABLE `withdrawals`
  ADD CONSTRAINT `fk_withdraw_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constrângeri pentru tabele `withdrawal_requests`
--
ALTER TABLE `withdrawal_requests`
  ADD CONSTRAINT `fk_wr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
