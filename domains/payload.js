const domainData =  async(domain) => {
  return  {
    domain: domain,
    consent: {
      agreementKeys: ["DNRA"],
      agreedBy: "Cardinal Ncube",
      agreedAt: new Date().toISOString(),
    },
    period: 1,
    contactRegistrant: {
      nameFirst: "Cardinal",
      nameMiddle: "",
      nameLast: "Ncube",
      organization: "YeduAI",
      jobTitle: "CEO",
      email: "admin@yeduai.io",
      phone: "+48.536892524",
      addressMailing: {
        address1: "Gierymskiego 3/45",
        address2: " ",
        city: "Warsaw",
        state: "Masovian",
        postalCode: "04228",
        country: "PL",
      },
    },
    contactAdmin: {
      nameFirst: "Cardinal",
      nameMiddle: "",
      nameLast: "Ncube",
      organization: "YeduAI",
      jobTitle: "CEO",
      email: "admin@yeduai.io",
      phone: "+48.536892524",
      addressMailing: {
        address1: "Gierymskiego 3/45",
        address2: " ",
        city: "Warsaw",
        state: "Masovian",
        postalCode: "04228",
        country: "PL",
      },
    },
    contactTech: {
      nameFirst: "Cardinal",
      nameMiddle: "",
      nameLast: "Ncube",
      organization: "YeduAI",
      jobTitle: "CEO",
      email: "admin@yeduai.io",
      phone: "+48.536892524",
      addressMailing: {
        address1: "Gierymskiego 3/45",
        address2: " ",
        city: "Warsaw",
        state: "Masovian",
        postalCode: "04228",
        country: "PL",
      },
    },
    contactBilling: {
      nameFirst: "Cardinal",
      nameMiddle: "",
      nameLast: "Ncube",
      organization: "YeduAI",
      jobTitle: "CEO",
      email: "admin@yeduai.io",
      phone: "+48.536892524",
      addressMailing: {
        address1: "Gierymskiego 3/45",
        address2: " ",
        city: "Warsaw",
        state: "Masovian",
        postalCode: "04228",
        country: "PL",
      },
    },
  }
}

const domainRecords = async(serverIP,nameServers)=>{
    return [
    {
      data: serverIP,
      name: "@",
      ttl: 3600,
      type: "A",
    },
    {
      data: serverIP,
      name: "www",
      ttl: 3600,
      type: "A",
    },
    ...nameServers.map((ns) => ({
      data: ns,
      name: "@",
      ttl: 3600,
      type: "NS",
    })),
  ];
}

module.exports = {
    domainRecords,
    domainData
}
