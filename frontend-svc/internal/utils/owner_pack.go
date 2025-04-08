package utils

import "strings"

var OwnerPostfixes = []string{"__watcher", "__generator", "__udp_server"}

func OwnerPack(owner string) (group []string) {
	if strings.Contains(owner, "__") {
		parts := strings.Split(owner, "__")
		if len(parts) == 2 && parts[1] != "api" {
			owner = parts[0]
		}
		if len(parts) > 2 {
			return []string{owner}
		}
	}

	group = append(group, owner)
	for _, v := range OwnerPostfixes {
		group = append(group, owner+v)
	}
	if !strings.Contains(owner, "__api") {
		group = append(group, owner+"__api")
		for _, v := range OwnerPostfixes {
			group = append(group, owner+"__api"+v)
		}
	}

	return
}
